<!-- eslint-disable vue/no-v-html -->
<template>
  <ParentLayout>
    <main class="package-detail">
      <div class="main-container container">
        <div class="columns breadcrumb-wrap">
          <div class="column col-12">
            <ul class="breadcrumb">
              <li class="breadcrumb-item">
                <NavLink :item="homeLink" />
              </li>
              <li class="breadcrumb-item">
                <NavLink :item="packagesLink" />
              </li>
              <li class="breadcrumb-item">
                <a href="#">{{ $package.name }}</a>
              </li>
            </ul>
          </div>
          <div class="column col-8 col-sm-12 topics-wrap">
            <a v-for="item in $topics" :key="item.slug" :href="item.link"
              ><span class="label label-rounded"> {{ item.name }}</span></a
            >
            <span
              v-if="packagePending"
              class="tooltip"
              data-tooltip="The package has no release yet"
            >
              <span class="label label-rounded bg-warning">
                <i class="fas fa-spinner"></i> Pending
              </span>
            </span>
          </div>
          <div class="column col-8 col-sm-12">
            <div class="theme-default-content">
              <div v-if="$data.readmeRaw" class="readme-wrap">
                <div v-html="readmeHtml"></div>
              </div>
              <p v-else class="readme-wrap">loading...</p>
              <div class="divider"></div>
              <p><NavLink :item="editNavLink" /></p>
            </div>
          </div>
          <div class="column col-4 col-sm-12">
            <div class="meta-section container">
              <div class="columns">
                <section v-if="packagePending" class="col-12">
                  <h2>Pending reason</h2>
                  <div>
                    <span v-if="packageNotSucceededBuilds.length"
                      >The package has in-processing or failed builds.</span
                    >
                    <span v-else>
                      The package has no valid <NavLink :item="tagsNavLink" />.
                      Please check out
                      <a
                        href="/docs/adding-upm-package.html#handling-a-repository-without-git-tag"
                      >
                        handling repository without releases </a
                      >.
                    </span>
                  </div>
                </section>
                <section class="col-12">
                  <h2>Install <small>(click to copy)</small></h2>
                  <div class="install-cli">
                    <div
                      data-tooltip="Copied"
                      class="tooltip tooltip-click"
                      tabindex="-1"
                      @click="onCopyCli"
                    >
                      <code>
                        <i class="fas fa-angle-double-right"></i>
                        {{ packageInstallCli }}
                      </code>
                    </div>
                    <small
                      >requires <NavLink :item="openupmCliRepoLink"
                    /></small>
                  </div>
                </section>
                <section class="col-12">
                  <h2>Project</h2>
                  <div>
                    <span><NavLink :item="repoNavLink"/></span>
                  </div>
                  <div v-if="parentRepoNavLink" class="fork">
                    forked from
                    <NavLink :item="parentRepoNavLink" />
                  </div>
                </section>
                <section class="col-6 col-sm-12">
                  <h2>Author</h2>
                  <a
                    v-if="parentOwnerNavLink"
                    :href="parentOwnerNavLink.link"
                    rel="noopener noreferrer"
                    class="nav-link external"
                  >
                    <span class="chip">
                      <img
                        v-if="$package.parentOwnerAvatarUrl"
                        :src="$package.parentOwnerAvatarUrl"
                        :alt="$package.parentOwner"
                        class="avatar avatar-sm"
                      />
                      <i v-else class="fa fa-user"></i>
                      {{ parentOwnerNavLink.text }}
                    </span>
                  </a>
                  <a
                    :href="ownerNavLink.link"
                    rel="noopener noreferrer"
                    class="nav-link external"
                  >
                    <span class="chip">
                      <img
                        :src="$package.ownerAvatarUrl"
                        :alt="$package.owner"
                        class="avatar avatar-sm"
                      />
                      {{ ownerNavLink.text }}
                    </span>
                  </a>
                </section>
                <section class="col-6 col-sm-12">
                  <h2>Discovered by</h2>
                  <a
                    v-if="$package.hunterUrl"
                    :href="hunterNavLink.link"
                    rel="noopener noreferrer"
                    class="nav-link external"
                  >
                    <span class="chip">
                      <img
                        :src="$package.hunterAvatarUrl"
                        :alt="hunterNavLink.text"
                        class="avatar avatar-sm"
                      />
                      {{ hunterNavLink.text }}
                    </span>
                  </a>
                  <span v-else>{{ this.$package.hunter }}</span>
                </section>
                <section class="col-6 col-sm-12">
                  <h2>License</h2>
                  <span>{{
                    $package.licenseSpdxId || $package.licenseName
                  }}</span>
                </section>
                <section class="col-6 col-sm-12">
                  <h2>Stars</h2>
                  <span>
                    <i class="fa fa-star"></i>
                    {{ packageStargazersCount }}
                  </span>
                </section>
                <section class="col-6 col-sm-12">
                  <h2>Version</h2>
                  <span>{{ packageVersion || "-" }}</span>
                </section>
                <section class="col-6 col-sm-12">
                  <h2>Unity Version</h2>
                  <span>{{ packageUnityVersion || "-" }}</span>
                </section>
                <section class="col-6 col-sm-12">
                  <h2>Published</h2>
                  <span>{{ packagePublishedAt || "-" }}</span>
                </section>
                <section class="col-6 col-sm-12"></section>
                <section v-if="dependencies.length" class="col-12">
                  <h2>Dependencies ({{ dependencies.length }})</h2>
                  <div v-if="dependencies.length" class="container">
                    <ul class="section-list">
                      <li
                        v-for="entry in dependencies"
                        :key="entry.name"
                        class="columns"
                      >
                        <div class="col-12">
                          <div class="tooltip" :data-tooltip="entry.tooltip">
                            <NavLink
                              v-if="entry.link"
                              :item="entry.link"
                              class="dep-text"
                            />
                            <a
                              v-else
                              class="dep-text tooltip tooltip-right tooltip-click"
                              data-tooltip="Copied"
                              @click="onCopyText(entry.depsJson)"
                              ><i :class="entry.icon"></i>
                              {{ entry.shortName }}</a
                            >
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <span v-else>-</span>
                </section>
                <section v-if="packageVersions.length" class="col-12">
                  <h2>Version history</h2>
                  <div class="container">
                    <ul class="section-list">
                      <li
                        v-for="entry in packageVersions"
                        :key="entry.version"
                        class="columns"
                      >
                        <div class="col-6">
                          <i :class="entry.class"></i>
                          <span
                            class="tooltip"
                            :data-tooltip="'Unity version: ' + entry.unity"
                            >{{ entry.version }}</span
                          >
                        </div>
                        <div class="col-6">
                          <span>
                            {{ entry.timeSince }}
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </section>
                <section v-if="packageNotSucceededBuilds.length" class="col-12">
                  <h2>Build issues</h2>
                  <div class="container">
                    <ul class="section-list">
                      <li
                        v-for="build in packageNotSucceededBuilds"
                        :key="build.id"
                        class="columns"
                      >
                        <div class="col-6">
                          <i :class="build.class"></i>
                          <span>{{ build.tag }}</span>
                        </div>
                        <div class="col-6">
                          <a
                            v-if="build.build.buildId"
                            :href="build.buildUrl"
                            build="noopener noreferrer"
                            :data-tooltip="build.solution"
                            class="tooltip"
                          >
                            <span>
                              {{ build.text }}
                            </span>
                          </a>
                          <span v-else>{{ build.text }}</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </section>
                <section v-if="packageInvalidTags.length" class="col-12">
                  <h2
                    class="tooltip tooltip-top"
                    data-tooltip="Non-semver or duplicated tags."
                  >
                    Invalid tags
                    <i class="fa fa-info-circle"></i>
                  </h2>
                  <div>
                    <span>{{ packageInvalidTagsString }}</span>
                  </div>
                </section>
                <section class="col-12">
                  <h2>Badge <small>(click to copy)</small></h2>
                  <div class="container">
                    <div class="columns">
                      <div class="col-6">
                        <img :src="badgeVersionImageUrl" />
                      </div>
                      <div class="col-6">
                        <a
                          :href="badgeUrl"
                          data-tooltip="Copied"
                          class="tooltip tooltip-click"
                          @click.prevent="onCopyBadgeVersionHtml"
                        >
                          <small>
                            html
                          </small>
                        </a>
                        <span>·</span>
                        <a
                          :href="badgeUrl"
                          data-tooltip="Copied"
                          class="tooltip tooltip-click"
                          @click.prevent="onCopyBadgeVersionMarkdown"
                        >
                          <small>
                            markdown
                          </small>
                        </a>
                      </div>
                    </div>
                  </div>
                </section>
                <section v-if="$relatedPackages.length" class="col-12">
                  <h2>Related packages</h2>
                  <div class="container">
                    <div class="columns">
                      <div
                        v-for="relatedPackage in $relatedPackages"
                        :key="relatedPackage.name"
                        class="col-12"
                      >
                        <div class="pkg-sm">
                          <h3 class="pkg-title">
                            <NavLink :item="relatedPackage.link" />
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Content class="theme-default-content custom" />
    </main>
  </ParentLayout>
</template>

<script>
import axios from "axios";
import escape from "escape-html";
import copy from "copy-to-clipboard";
import marked from "marked";
import { noCase } from "change-case";
import urljoin from "url-join";

import NavLink from "@theme/components/NavLink.vue";
import ParentLayout from "@theme/layouts/Layout.vue";
import { ReleaseState, ReleaseReason } from "@root/app/models/common";
import util from "@root/docs/.vuepress/util";

const defaultData = function() {
  return {
    readmeRaw: "",
    packageInfo: {
      fetched: false
    },
    registryInfo: {
      fetched: false
    }
  };
};

const ReleaseReasonSolution = {};
const internalErrorSolution = "Internal failure, please report an issue.";
ReleaseReasonSolution[ReleaseReason.None.value] =
  "Unknown failure, please report an issue.";
ReleaseReasonSolution[ReleaseReason.BadRequest.value] = internalErrorSolution;
ReleaseReasonSolution[ReleaseReason.Unauthorized.value] = internalErrorSolution;
ReleaseReasonSolution[ReleaseReason.Forbidden.value] = internalErrorSolution;
ReleaseReasonSolution[ReleaseReason.EntityTooLarge.value] =
  "The package is too large.";
ReleaseReasonSolution[ReleaseReason.VersionConflict.value] =
  "The version already exists.";
ReleaseReasonSolution[
  ReleaseReason.InternalError.value
] = internalErrorSolution;
ReleaseReasonSolution[ReleaseReason.BadGateway.value] = internalErrorSolution;
ReleaseReasonSolution[
  ReleaseReason.ServiceUnavailable.value
] = internalErrorSolution;
ReleaseReasonSolution[ReleaseReason.BuildTimeout.value] =
  "The build is timeout.";
ReleaseReasonSolution[ReleaseReason.BuildCancellation.value] =
  "The build is cancelled manually.";
ReleaseReasonSolution[ReleaseReason.PackageNotFound.value] =
  "The Git tag has no package.json file.";
ReleaseReasonSolution[ReleaseReason.Private.value] =
  "The package is explicitly private.";
ReleaseReasonSolution[ReleaseReason.PackageNameNotMatch.value] =
  "The name of package.json isn't matched.";

export default {
  components: { ParentLayout, NavLink },
  data() {
    return defaultData();
  },
  computed: {
    homeLink() {
      return {
        link: "/",
        text: "Home"
      };
    },
    packagesLink() {
      return {
        link: "/packages/",
        text: "Packages"
      };
    },
    dependencies() {
      const versions = this.registryInfo.versions || {};
      const entry = versions[this.packageVersion];
      if (!entry || !entry.dependencies) return [];
      else
        return Object.entries(entry.dependencies).map(([name, version]) => {
          const isGit = version.startsWith("git");
          let nameWithVersion = `${name}@${version}`;
          const nameWithVersionMaxLen = 38;
          const nameWithVersionLimited =
            nameWithVersion.length > nameWithVersionMaxLen
              ? nameWithVersion.slice(0, nameWithVersionMaxLen) + "..."
              : nameWithVersion;
          const url = util.getPackageUrl(this.$site.pages, name);
          let tooltip = null;
          let icon = null;
          if (isGit) {
            if (url) {
              tooltip = `Found Git dependency, but the package is also available on OpenUPM: ${nameWithVersion}.`;
              icon = "fab fa-git text-warning";
            } else {
              tooltip = `Missing Git dependency, please install it manually (click to copy): ${nameWithVersion}.`;
              icon = "fas fa-exclamation-triangle text-error";
            }
          } else if (url) {
            tooltip = nameWithVersion;
            icon = "fa fa-box-open";
          } else {
            tooltip = `Missing dependency, please install it manually (click to copy): ${nameWithVersion}.`;
            icon = "fas fa-exclamation-triangle text-error";
          }
          const depsObj = { dependencies: {} };
          depsObj.dependencies[name] = version;
          const depsJson = JSON.stringify(depsObj);
          return {
            icon,
            isGit,
            name: name,
            shortName: nameWithVersionLimited,
            link: url
              ? {
                  link: url,
                  text: nameWithVersionLimited,
                  icon,
                  iconLeft: true
                }
              : null,
            tooltip,
            version,
            depsJson
          };
        });
    },
    $package() {
      const pkg = this.$page.frontmatter.package;
      const extra = this.$store.getters.packagesExtra[pkg.name];
      return util.joinPackageExtra(pkg, extra);
    },
    $relatedPackages() {
      return this.$page.frontmatter.relatedPackages;
    },
    $topics() {
      return this.$page.frontmatter.topics;
    },
    packageName() {
      return this.$package.displayName || this.$package.name;
    },
    packageVersion() {
      const distTags = this.registryInfo["dist-tags"];
      if (distTags && distTags.latest) return distTags.latest;
      else return null;
    },
    packagePublishedAt() {
      const time = this.registryInfo.time || {};
      const dateTimeStr = time[this.packageVersion];
      if (!dateTimeStr) return null;
      return this.getTimeSince(dateTimeStr);
    },
    packageUnityVersion() {
      const versions = this.registryInfo.versions || {};
      const entry = versions[this.packageVersion];
      if (!entry) return null;
      return entry.unity;
    },
    packageBuilds() {
      let builds = this.$data.packageInfo.releases;
      if (builds && builds.length) {
        let objs = [];
        for (let build of builds) {
          let obj = {
            id: build.version,
            build,
            class: "",
            tag: build.tag,
            text: "",
            state: ReleaseState.get(build.state),
            solution: ReleaseReasonSolution[build.reason] || "",
            reason: ReleaseReason.get(build.reason),
            buildUrl: util.getAzureWebBuildUrl(build.buildId),
            timeSince: this.getTimeSince(build.updatedAt)
          };
          if (obj.state == ReleaseState.Pending) {
            obj.class = "fa fa-clock-o";
            obj.text = "pending";
          } else if (obj.state == ReleaseState.Building) {
            obj.class = "fa fa-spinner fa-spin";
            obj.text = "building";
          } else if (obj.state == ReleaseState.Succeeded) {
            obj.class = "fa fa-check-circle text-success";
          } else if (obj.state == ReleaseState.Failed) {
            obj.class = "fa fa-times-circle text-error";
            let reasonText = noCase(obj.reason.key);
            if (reasonText == "none") reasonText = "unknown";
            obj.text = reasonText;
          }
          objs.push(obj);
        }
        return objs;
      }
      return [];
    },
    packageVersions() {
      const versions = this.registryInfo.versions || {};
      const times = this.registryInfo.time;
      const versionKeys = Object.keys(versions).reverse();
      return versionKeys.map(x => {
        return {
          version: x,
          class: "fa fa-check-circle text-success",
          unity: versions[x].unity,
          timeSince: this.getTimeSince(times[x])
        };
      });
    },
    packageNotSucceededBuilds() {
      return this.packageBuilds.filter(x => x.state != ReleaseState.Succeeded);
    },
    packageInvalidTags() {
      return this.$data.packageInfo.invalidTags || [];
    },
    packageInvalidTagsString() {
      let tags = this.packageInvalidTags;
      if (tags.length == 2) return `${tags[0]} and ${tags[1]}.`;
      else if (tags.length == 1) return tags[0];
      else if (tags.length == 0) return "";
      else {
        let num = tags.length - 2;
        return `${tags[0]}, ${tags[1]} and ${num} more`;
      }
    },
    packageStargazersCount() {
      return this.$package.stars;
    },
    packageInstallCli() {
      const name = this.$package.name;
      if (!this.$data.packageInfo.fetched) {
        return "loading...";
      } else if (this.packageVersions.length) {
        return `openupm add ${name}`;
      } else {
        return "not available yet";
      }
    },
    packagePending() {
      if (!this.$data.packageInfo.fetched || !this.$data.registryInfo.fetched) {
        return false;
      }
      return !this.packageVersion;
    },
    badgeVersionHtml() {
      return `<a href="${escape(this.badgeUrl)}"><img src="${escape(
        this.badgeVersionImageUrl
      )}" /></a>`;
    },
    badgeVersionMarkdown() {
      return `[![openupm](${this.badgeVersionImageUrl})](${this.badgeUrl})`;
    },
    readmeHtml() {
      if (!this.$data.readmeRaw) return "";
      else {
        const linkBaseUrl = urljoin(
          this.$package.repoUrl,
          "blob/" + this.$package.readmeBranch
        );
        const linkBaseRelativeUrl = urljoin(
          this.$package.repoUrl,
          "blob/" + this.$package.readmeBase
        );
        const imageBaseUrl = urljoin(
          this.$package.repoUrl,
          "raw/" + this.$package.readmeBranch
        );
        const imageBaseRelativeUrl = urljoin(
          this.$package.repoUrl,
          "raw/" + this.$package.readmeBase
        );
        const renderer = util.markedRenderer({
          linkBaseUrl,
          linkBaseRelativeUrl,
          imageBaseUrl,
          imageBaseRelativeUrl
        });
        const html = marked(this.$data.readmeRaw, { renderer });
        return util.postMarkdown(html, { imageBaseRelativeUrl });
      }
    },
    repoNavLink() {
      return {
        link: this.$package.repoUrl,
        text: this.$package.repo
      };
    },
    parentRepoNavLink() {
      if (this.$package.parentRepoUrl)
        return {
          link: this.$package.parentRepoUrl,
          text: this.$package.parentRepo
        };
      return null;
    },
    ownerNavLink() {
      return {
        link: this.$package.ownerUrl,
        text: this.$package.owner
      };
    },
    parentOwnerNavLink() {
      if (this.$package.parentRepoUrl)
        return {
          link: this.$package.parentOwnerUrl,
          text: this.$package.parentOwner
        };
      return null;
    },
    hunterNavLink() {
      return {
        link: this.$package.hunterUrl,
        text: this.$package.hunter
      };
    },
    tagsNavLink() {
      return {
        link: urljoin(this.$package.repoUrl, "tags"),
        text: "GitHub tags"
      };
    },
    editNavLink() {
      return {
        link: urljoin(
          util.openupmRepoUrl,
          "/blob/master/data/packages",
          this.$package.name + ".yml"
        ),
        text: "Edit this package"
      };
    },
    openupmCliRepoLink() {
      return {
        link: util.openupmCliRepoUrl,
        text: "openupm-cli"
      };
    },
    badgeUrl() {
      return urljoin(this.$site.themeConfig.domain, this.$page.path);
    },
    badgeVersionImageUrl() {
      return `https://img.shields.io/npm/v/${this.$package.name}?label=openupm&registry_uri=https://package.openupm.com`;
    }
  },
  watch: {
    // eslint-disable-next-line no-unused-vars
    $route(to, from) {
      Object.assign(this.$data, defaultData());
      this.onStart();
    }
  },
  mounted() {
    this.onStart();
  },
  methods: {
    onStart() {
      this.fetchPackageInfo();
      this.fetchRegistryInfo();
    },
    handleRepoReadme() {
      const titleLine = "# " + this.packageName + "\n";
      let readmeRaw = this.packageInfo.readme;
      if (readmeRaw) {
        // Insert h1 if need.
        if (
          !/^# /m.test(readmeRaw) &&
          !/^===/m.test(readmeRaw) &&
          !/^<h1/m.test(readmeRaw)
        ) {
          readmeRaw = titleLine + readmeRaw;
        }
        this.$data.readmeRaw = readmeRaw;
      } else {
        // Rollback to default readme.
        this.$data.readmeRaw = `${titleLine}
${this.$package.description}

See more in the [${this.$package.repo}](${this.$package.repoUrl}) repository.
`;
      }
    },
    async fetchPackageInfo() {
      try {
        let resp = await axios.get(
          urljoin(util.openupmPackagesApiUrl, this.$package.name),
          {
            headers: { Accept: "application/json" }
          }
        );
        this.$data.packageInfo = { ...resp.data };
      } catch (error) {
        console.error(error);
      } finally {
        this.$data.packageInfo.fetched = true;
      }
      this.handleRepoReadme();
    },
    async fetchRegistryInfo() {
      try {
        let resp = await axios.get(
          urljoin(util.openupmRegistryUrl, this.$package.name),
          {
            headers: { Accept: "application/json" }
          }
        );
        this.$data.registryInfo = { ...resp.data };
      } catch (error) {
        console.error(error);
      } finally {
        this.$data.registryInfo.fetched = true;
      }
    },
    getTimeSince(epochOrDateTimeStr) {
      try {
        const date = new Date(epochOrDateTimeStr);
        return util.timeAgoFormat(date);
      } catch (error) {
        return "";
      }
    },
    onCopyCli() {
      copy(this.packageInstallCli, { format: "text/plain" });
    },
    onCopyBadgeVersionHtml() {
      copy(this.badgeVersionHtml, { format: "text/plain" });
    },
    onCopyBadgeVersionMarkdown() {
      copy(this.badgeVersionMarkdown, { format: "text/plain" });
    },
    onCopyText(text) {
      copy(text, { format: "text/plain" });
    }
  }
};
</script>

<style lang="stylus">
.package-detail
  .main-container
    margin-top 1rem

    .tooltip-click, .tooltip-click a
      cursor pointer

    .topics-wrap
      margin-bottom 0.8rem
      .label
        font-size 0.7rem
        margin-right 0.3rem

    .readme-wrap
      margin-bottom 2rem

    .theme-default-content
      max-width auto
      margin 0
      padding 0 0 2.5rem
      font-size 0.75rem
      :first-child
        margin-top 0
      ol
        list-style decimal

    .meta-section
      padding-left 0.5rem

      h2
        font-weight 600
        border-bottom none

      a, h2, p, span, ul, li, div.toast
        font-size 0.75rem

      span, span a
        font-size 0.7rem

      div.toast
        p
          font-size 0.7rem

      section:not(:last-child)
        border-bottom 1px solid $borderColor
        padding-bottom 0.5rem
        margin-bottom 0.7rem

      ul.section-list
        margin 0
        list-style none

      .install-cli
        position relative
        a
          &:hover
            text-decoration none !important
        code
          display block
          white-space nowrap
          overflow hidden
          margin-bottom 0.4rem
          padding 0.7rem
          font-size 0.75rem
          background-color #fff
          border 1px solid $borderColor
          color $accentColor
          cursor pointer
          &:hover
            background-color #fcf2f2
          &:before
            color #bcc3ce
            content attr(data-lang)
            font-size .6rem
            position absolute
            right .2rem
            top .1rem

      i, img
        vertical-align middle

      i.fa-user
        padding-right 0.2rem
        color $textColor

      .fork
        font-size 0.6rem
        a
          font-size 0.6rem

      .dep-text
        overflow-wrap break-word
        max-width 10rem

      .tooltip::after
        white-space normal
        overflow-wrap break-word
</style>
