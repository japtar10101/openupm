"use strict";
// Build package release job.

const config = require("config");
const superagent = require("superagent");
const util = require("util");

const sleep = util.promisify(setTimeout);

const {
  ReleaseState,
  ReleaseReason,
  RetryableReleaseReason
} = require("../models/common");
const Release = require("../models/release");
const { cleanRepoUrl, loadPackage } = require("../utils/package");
const {
  getBuildApi,
  queueBuild,
  waitBuild,
  BuildStatus,
  BuildResult
} = require("../utils/azure");
const logger = require("../utils/log")(module);

// Build release for given packageName and version.
let buildRelease = async function(packageName, version) {
  // Get release record.
  let release = await Release.fetchOneOrThrow(packageName, version);
  // Load package.
  let pkg = await loadPackage(release.packageName);
  // Update release state.
  let shouldContinue = await updateReleaseState(release);
  if (!shouldContinue) return;
  // Get build api.
  let buildApi = await getBuildApi();
  // Update release build.
  await updateReleaseBuild(buildApi, pkg, release);
  // Wait release build.
  let build = await waitReleaseBuild(buildApi, release);
  // Handle release build.
  await handleReleaseBuild(build, release);
};

/* Update release state, return continue boolean.
 * - skip for succeeded state.
 * - continue for building state.
 * - continue for failed state with timeout reason.
 * - queue new build for pending and failed state with other reasons.
 */
const updateReleaseState = async function(release) {
  if (release.state == ReleaseState.Succeeded) {
    logger.debug(
      { rel: `${release.packageName}@${release.version}` },
      "skip successful release"
    );
    return false;
  } else if (
    release.state == ReleaseState.Failed &&
    release.reason == ReleaseReason.BuildTimeout
  ) {
    release.state = ReleaseState.Building.value;
    release.reason = ReleaseReason.None.value;
    await Release.save(release);
  } else if (
    release.state == ReleaseState.Pending ||
    release.state == ReleaseState.Failed
  ) {
    release.state = ReleaseState.Building.value;
    release.buildId = "";
    await Release.save(release);
  }
  return true;
};

// Update release build.
const updateReleaseBuild = async function(buildApi, pkg, release) {
  if (!release.buildId) {
    logger.info(
      { rel: `${release.packageName}@${release.version}` },
      "queue build"
    );
    let definitionId = config.azureDevops.definitionId;
    let parameters = {
      repoUrl: cleanRepoUrl(pkg.repoUrl, "https"),
      repoBranch: release.tag,
      packageName: pkg.name,
      packageVersion: release.version
    };
    let build = await queueBuild(buildApi, definitionId, parameters);
    // eslint-disable-next-line require-atomic-updates
    release.buildId = build.id + "";
    await Release.save(release);
    await sleep(config.azureDevops.check.duration);
  }
};

// Wait release build.
const waitReleaseBuild = async function(buildApi, release) {
  logger.debug(
    {
      rel: `${release.packageName}@${release.version}`,
      buildId: release.buildId
    },
    "wait build"
  );
  let build = await waitBuild(buildApi, release.buildId);
  return build;
};

// Handle release build.
const handleReleaseBuild = async function(build, release) {
  // Update publish log.
  let publishLog = "";
  if (release.buildId) publishLog = await getPublishLog(release);
  // Handle build succeeded.
  if (
    build &&
    build.status == BuildStatus.Completed &&
    build.result == BuildResult.Succeeded
  ) {
    // eslint-disable-next-line require-atomic-updates
    release.state = ReleaseState.Succeeded.value;
    // eslint-disable-next-line require-atomic-updates
    release.reason = ReleaseReason.None.value;
    await Release.save(release);
    logger.info(
      {
        rel: `${release.packageName}@${release.version}`,
        build: release.buildId
      },
      "build succeeded"
    );
  }
  // Handle build failed.
  else {
    let reason = ReleaseReason.None;
    if (build === null) reason = ReleaseReason.BuildTimeout;
    else if (build.status == BuildStatus.Cancelling)
      reason = ReleaseReason.BuildCancellation;
    else reason = getReasonFromPublishLog(publishLog);
    // eslint-disable-next-line require-atomic-updates
    release.state = ReleaseState.Failed.value;
    // eslint-disable-next-line require-atomic-updates
    release.reason = reason.value;
    await Release.save(release);
    logger.error(
      {
        rel: `${release.packageName}@${release.version}`,
        build: release.buildId,
        reason: reason.key
      },
      "build failed"
    );
    // Throw error for retryable reason to retry.
    if (RetryableReleaseReason.includes(reason))
      throw new Error(
        `build ${release.packageName}@${release.version} failed with retryable reason: ${reason}`
      );
  }
};

// Get publish log
const getPublishLog = async function(release) {
  let resp = await superagent.get(Release.buildPublishResultUrl(release));
  return resp.text;
};

// Get reason from publish log.
const getReasonFromPublishLog = function(text) {
  if (text.includes("EPUBLISHCONFLICT")) return ReleaseReason.VersionConflict;
  else if (text.includes("ENOENT") && text.includes("error path package.json"))
    return ReleaseReason.PackageNotFound;
  else if (text.includes("error code E400")) return ReleaseReason.BadRequest;
  else if (text.includes("error code E401")) return ReleaseReason.Unauthorized;
  else if (text.includes("error code E403")) return ReleaseReason.Forbidden;
  else if (text.includes("error code E413"))
    return ReleaseReason.EntityTooLarge;
  else if (text.includes("error code E500")) return ReleaseReason.InternalError;
  else if (text.includes("error code E502")) return ReleaseReason.BadGateway;
  else if (text.includes("error code E503"))
    return ReleaseReason.ServiceUnavailable;
  else if (text.includes("error code EPRIVATE")) return ReleaseReason.Private;
  return ReleaseReason.None;
};

module.exports = { buildRelease };

if (require.main === module) {
  let program = require("../utils/commander");
  let packageNameVal = null;
  let versionVal = null;
  program
    .arguments("<packageName> <version>")
    .action(function(packageName, version) {
      packageNameVal = packageName;
      versionVal = version;
    })
    .parse(process.argv)
    .requiredArgs(1)
    .run(buildRelease, packageNameVal, versionVal);
}
