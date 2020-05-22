// OpenUPM Package Plugin.
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const util = require("util");
const spdx = require("spdx-license-list");
const yaml = require("js-yaml");
const {
  getNamespace,
  loadTopics,
  loadPackageSync,
  loadPackageNames
} = require("../../../../app/utils/package");

const readFile = util.promisify(fs.readFile);
const pluginData = {};

// eslint-disable-next-line no-unused-vars
module.exports = function(options, context) {
  const plugin = {
    // #region plugin interface
    name: "openupm-packages",

    clientRootMixin: path.resolve(__dirname, "clientRootMixin.js"),

    async extendPageData($page) {
      if ($page.path == "/") {
        const data = await plugin.getData();
        $page.packageCount = data.packageNames.length;
        $page.packages = data.packages;
      }
    },

    async additionalPages() {
      const data = await plugin.getData();
      let pages = [];
      pages = pages.concat(await plugin.genListPages(data));
      pages = pages.concat(await plugin.genDetailPages(data));
      pages.push(await plugin.genAddPage(data));
      pages.push(await plugin.genContributorsPage(data));
      return pages;
    },
    // #endregion

    // #region page generators
    // Prepare data for page generation
    async getData() {
      if (!pluginData.data) {
        // Load packages.
        const packageNames = await loadPackageNames();
        const packages = packageNames
          .map(loadPackageSync)
          .filter(x => x)
          .map(pkg => {
            return {
              ...pkg,
              link: {
                link: `/packages/${pkg.name}/`,
                text: pkg.displayName || pkg.name
              }
            };
          })
          // Sort by name
          .sort(function(a, b) {
            const va = a.link.text.toLowerCase();
            const vb = b.link.text.toLowerCase();
            if (va < vb) return -1;
            if (va > vb) return 1;
            return 0;
          });
        // Namespace => [package...] dict.
        const packageByNamespace = _.groupBy(packages, x =>
          getNamespace(x.name)
        );
        // Load topics.
        const topicsWithAll = [{ name: "All", slug: "" }]
          .concat(await loadTopics())
          .map(topic => {
            return {
              ...topic,
              link: topic.slug
                ? `/packages/topics/${topic.slug}/`
                : "/packages/",
              count: packages.filter(pkg =>
                plugin.packageTopicFilter(pkg, topic.slug)
              ).length
            };
          });
        const topics = topicsWithAll.slice(1);
        // contributors
        const getConstributors = function(type) {
          const entries = _.flatMap(packages, pkg => {
            if (type == "hunter") return [pkg.hunter];
            else if (type == "owner") {
              let arr = [pkg.owner];
              if (
                pkg.parentOwner &&
                pkg.parentOwnerUrl.toLowerCase().includes("github")
              )
                arr.push(pkg.parentOwner);
              return arr;
            } else return [];
          }).filter(x => x && x != "-");
          const counted = _.countBy(entries);
          const pairs = _.toPairs(counted).map(x => ({
            user: x[0],
            count: x[1]
          }));
          return _.sortBy(pairs, "count").reverse();
        };
        // Package hunters
        const hunters = getConstributors("hunter");
        const owners = getConstributors("owner");
        // Backers
        const backerPath = path.resolve(
          __dirname,
          "../../../../data/backers.yml"
        );
        const backers = yaml.safeLoad(await readFile(backerPath, "utf8"));
        // // Recent packages
        // const recentAddedPackages = _.orderBy(packages, ["createdAt"], ["desc"])
        //   .filter(x => !x.excludedFromList)
        //   .slice(0, 10);
        // eslint-disable-next-line require-atomic-updates
        pluginData.data = {
          backers,
          packageNames,
          packages,
          // recentAddedPackages,
          packageByNamespace,
          topics,
          topicsWithAll,
          hunters,
          owners
        };
      }
      return pluginData.data;
    },

    // Generate package list pages
    async genListPages(data) {
      let pages = [];
      for (let topic of data.topicsWithAll) {
        // Skip topic with no packages.
        if (topic.slug && topic.count == 0) continue;
        let frontmatter = {
          layout: "PackageList",
          noGlobalSocialShare: true,
          title: topic.slug ? `Packages - ${topic.name}` : "Packages",
          topics: data.topicsWithAll,
          topic,
          packages: data.packages.filter(pkg =>
            plugin.packageTopicFilter(pkg, topic.slug)
          )
        };
        pages.push({
          path: topic.link,
          content: plugin.createPage(frontmatter)
        });
      }
      return pages;
    },

    // Generate package detail page
    async genDetailPages(data) {
      let pages = [];
      for (let pkg of data.packages) {
        let frontmatter = {
          layout: "PackageDetail",
          title: pkg.displayName
            ? `📦 ${pkg.displayName} - ${pkg.name}`
            : `📦 ${pkg.name}`,
          package: pkg,
          relatedPackages: data.packageByNamespace[
            getNamespace(pkg.name)
          ].filter(x => x.name != pkg.name),
          topics: (pkg.topics || [])
            .map(x => {
              const topic = data.topics.find(t => t.slug == x);
              if (topic) return topic;
              else return null;
            })
            .filter(x => x)
        };
        pages.push({
          path: "/packages/" + pkg.name + "/",
          content: plugin.createPage(frontmatter)
        });
      }
      return pages;
    },

    // Generate package detail page
    async genAddPage(data) {
      return {
        path: "/packages/add/",
        content: plugin.createPage({
          layout: "PackageAdd",
          title: "Package Add",
          licenses: Object.keys(spdx)
            .sort(function(a, b) {
              return spdx[a].name
                .toLowerCase()
                .localeCompare(spdx[b].name.toLowerCase());
            })
            .map(function(key) {
              return { id: key, name: spdx[key].name };
            }),
          packageNames: data.packageNames,
          topics: data.topics,
          noGlobalSocialShare: true
        })
      };
    },

    // Generate contribution
    async genContributorsPage(data) {
      return {
        path: "/contributors/",
        content: plugin.createPage({
          layout: "Contributors",
          title: "Contributors",
          hunters: data.hunters,
          owners: data.owners,
          backers: data.backers.backers,
          noGlobalSocialShare: true
        })
      };
    },
    // #endregion

    // #region helpers
    // Package topic filter function
    packageTopicFilter(pkg, topicSlug) {
      if (pkg.excludedFromList) return false;
      else if (!topicSlug) return true;
      else if (Array.isArray(pkg.topics)) return pkg.topics.includes(topicSlug);
      else return pkg.topics == topicSlug;
    },

    // Create page content from frontmatter
    createPage(frontmatter) {
      return "---\n" + yaml.safeDump(frontmatter) + "\n---\n";
    }
    // #endregion
  };
  return plugin;
};
