---
ads: true
layout: Home
pageClass: homepage
title: Open Source Unity Package Registry (UPM)
heroText: Open Source Unity Package Registry
actionText: Guide
actionLink: /docs/
features:
- title: Open Source UPM Registry
  details: Hosting community selective open source UPM packages
- title: Continuous Publishing
  details: Package publishing automation based on Git tags
- title: Command-Line Tool
  details: <a href="https://github.com/openupm/openupm-cli">OpenUPM-CLI</a> for 3rd-party UPM registries
noGlobalSocialShare: true
---

### Get Started

```sh
# Install openupm-cli
$ npm install -g openupm-cli
# OR yarn global add openupm-cli

# Enter your unity project folder
$ cd YOUR_UNITY_PROJECT_FOLDER

# Search a package
$ openupm search addressable-importer
┌───────────────────────────────────────┬─────────┬───────────┬────────────┐
│ Name                                  │ Version │ Author    │ Date       │
├───────────────────────────────────────┼─────────┼───────────┼────────────┤
│ com.littlebigfun.addressable-importer │ 0.4.1   │ Favo Yang │ 2019-11-25 │
│ Unity Addressable Importer            │         │           │            │
└───────────────────────────────────────┴─────────┴───────────┴────────────┘

# Install package
$ openupm add com.littlebigfun.addressable-importer
added: com.littlebigfun.addressable-importer@0.4.1
manifest updated, please open unity project to apply changes
```

::: warning COMPATIBILITY NOTE
openupm-cli requires [Node.js 12](https://nodejs.org/en/)
:::

<ClientOnly><PackageRecent :count="6" /></ClientOnly>

<social-share />

<style lang="stylus">
</style>
