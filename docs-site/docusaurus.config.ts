import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Radar.ai Docs',
  tagline: 'Documentacao tecnica e de produto do Radar.ai',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.radar.ai',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          // Single source of truth: reuse root project docs.
          path: '../docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Radar.ai Docs',
      logo: {
        alt: 'Radar.ai Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          label: 'Documentacao',
          position: 'left',
        },
        {
          to: '/docs/STATUS_AND_ROADMAP',
          label: 'Estado vs Roadmap',
          position: 'left',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentacao',
          items: [
            {label: 'Hub', to: '/docs'},
            {label: 'Estado vs Roadmap', to: '/docs/STATUS_AND_ROADMAP'},
          ],
        },
      ],
      copyright: `Copyright (c) ${new Date().getFullYear()} Radar.ai`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
