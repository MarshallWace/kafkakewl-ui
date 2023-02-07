<template>
  <q-layout view="lHh Lpr lFf">
    <q-layout-header>
      <q-toolbar
        color="primary"
      >
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
          icon="menu"
        />

        <q-toolbar-title>
          <q-item to="/" active-class="false" exact>
            kafkakewl
          </q-item>
        </q-toolbar-title>
        <router-view name="toolbar"></router-view>
      </q-toolbar>
    </q-layout-header>

    <q-layout-drawer
      v-model="leftDrawerOpen"
      :content-class="$q.theme === 'mat' ? 'bg-grey-2' : null"
    >
      <q-list
        no-border
        link
        inset-delimiter
      >
        <q-list no-border link inset-delimiter>
          <q-list-header>Navigation</q-list-header>
          <q-item to="/" exact>
            <q-item-side icon="home" />
            <q-item-main label="Topologies" />
          </q-item>
          <q-item to="/about">
            <q-item-side icon="info_outline" />
            <q-item-main label="About" />
          </q-item>

          <q-item-separator />
          <q-list-header>Useful Links</q-list-header>
          <q-item v-if="hasDocumentationUrl" @click.native="openDocumentationUrl()">
            <q-item-side icon="school" />
            <q-item-main label="kafkakewl documentation" :sublabel=documentationUrl></q-item-main>
          </q-item>
        </q-list>
      </q-list>
    </q-layout-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { openURL } from "quasar";

export default {
  name: "LayoutDefault",
  data() {
    return {
      documentationUrl: process.env.VUE_APP_KAFKAKEWL_DOCS_URL,
      leftDrawerOpen: false//this.$q.platform.is.desktop
    };
  },
  methods: {
    openDocumentationUrl() { openURL(this.documentationUrl) }
  },
  computed: {
    hasDocumentationUrl() { return (this.documentationUrl || "").trim() !== ""; }
  }
};
</script>

<style>
</style>
