import type { ThemeConfig } from 'antd';
import { px, token, type Density, type TypeStyleKey } from './token';

const c = token.color;
const fontSize = (key: TypeStyleKey) => px(token.styles[key].fontSize);
const scale = (density: Density) => {
  const k = (key: string) => (density === 'dense' ? `dense-${key}` : key) as TypeStyleKey;
  return {
    body: fontSize(k('body')),
    headings: [
      fontSize(k('h1')),
      fontSize(k('h2')),
      fontSize(k('h3')),
      fontSize(k('h4')),
      fontSize(k('h5')),
    ],
  };
};

/**
 * Ant Design theme derived only from `token` (port of the prototype's ChanelUI `L3`).
 * `compact` enlarges controls for touch on narrow viewports.
 */
export function buildAntdTheme(density: Density, opts: { compact?: boolean } = {}): ThemeConfig {
  const s = scale(density);
  const radius = px(token.radius.radius);
  const compactSizes = opts.compact
    ? {
        controlHeight: px(token.size['nav-trigger-size']),
        controlHeightLG: px(token.size['touch-target']),
        controlHeightSM: px(token.size['control-height-sm']),
      }
    : {};

  return {
    token: {
      colorPrimary: c.accent,
      colorPrimaryHover: c['ink-muted'],
      colorPrimaryActive: c['ink-muted'],
      colorPrimaryBorder: c.ink,
      colorPrimaryBorderHover: c['ink-muted'],
      colorTextLightSolid: c.paper,
      colorInfo: c.accent,
      colorLink: c.ink,
      colorLinkHover: c['ink-muted'],
      colorLinkActive: c['ink-muted'],
      colorTextBase: c.ink,
      colorTextSecondary: c['ink-muted'],
      colorTextTertiary: c['ink-muted'],
      colorTextDescription: c['ink-muted'],
      colorTextPlaceholder: c['ink-muted'],
      colorBgBase: c.paper,
      colorBgLayout: c.canvas,
      colorBorder: c['border-control'],
      colorBorderSecondary: c.border,
      colorSplit: c.border,
      colorError: c.error,
      colorErrorText: c.critical,
      colorWarning: c.warning,
      colorWarningText: c['warning-strong'],
      colorSuccess: c.success,
      controlItemBgActive: c['selected-option'],
      controlItemBgActiveHover: c['selected-option'],
      controlItemBgHover: c.canvas,
      // Ink at ~8% opacity, identical to the canonical selected-option color.
      controlOutline: c['selected-option'],
      fontFamily: token.families.text,
      fontWeightStrong: token.weights.text,
      borderRadius: radius,
      borderRadiusLG: radius,
      borderRadiusSM: radius,
      borderRadiusXS: radius,
      lineWidthFocus: px(token.size['focus-ring-width']),
      boxShadowSecondary: token.shadow['shadow-popup'],
      motionDurationFast: token.duration['duration-fast'],
      motionDurationMid: token.duration['duration-mid'],
      motionDurationSlow: token.duration['duration-slow'],
      fontSize: s.body,
      fontSizeHeading1: s.headings[0],
      fontSizeHeading2: s.headings[1],
      fontSizeHeading3: s.headings[2],
      fontSizeHeading4: s.headings[3],
      fontSizeHeading5: s.headings[4],
      wireframe: false,
      ...compactSizes,
    },
    components: {
      Layout: {
        headerBg: c.paper,
        bodyBg: c.canvas,
        headerHeight: px(token.size['header-height']),
        headerPadding: `0 ${token.spacing['content-padding-standard']}`,
        siderBg: c.paper,
      },
      Menu: {
        itemColor: c.ink,
        itemHoverColor: c.ink,
        itemHoverBg: c.canvas,
        itemActiveBg: c.canvas,
        itemSelectedBg: c['nav-selected-bg'],
        itemSelectedColor: c['nav-selected-text'],
        itemHeight: px(token.size['nav-item-height']),
        itemMarginInline: 0,
        itemMarginBlock: px(token.spacing['space-compact']),
        iconMarginInlineEnd: px(token.spacing['nav-icon-gap']),
        itemBorderRadius: radius,
        activeBarHeight: 0,
        activeBarBorderWidth: 0,
        subMenuItemBg: c.paper,
        collapsedWidth: px(token.size['nav-rail-collapsed-width']),
      },
      Button: {
        fontWeight: token.weights.text,
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
        defaultBg: c.paper,
        defaultColor: c.ink,
        defaultBorderColor: c.border,
        defaultHoverBg: c.canvas,
        defaultHoverColor: c['ink-muted'],
        defaultHoverBorderColor: c['ink-muted'],
        defaultActiveBg: c.canvas,
        defaultActiveColor: c['ink-muted'],
        defaultActiveBorderColor: c['ink-muted'],
        colorError: c.critical,
        colorErrorHover: c.critical,
        colorErrorActive: c.critical,
        colorErrorBorderHover: c.critical,
      },
      Table: {
        headerBg: c.ink,
        headerColor: c.paper,
        headerSortActiveBg: c['soft-black'],
        headerSortHoverBg: c['soft-black'],
        headerSplitColor: c.ink,
        headerFilterHoverBg: c['soft-black'],
        rowHoverBg: c['row-hover'],
        rowSelectedBg: c['row-selected'],
        rowSelectedHoverBg: c['row-selected'],
        colorIcon: c.paper,
        colorIconHover: c.paper,
        fixedHeaderSortActiveBg: c['soft-black'],
      },
      Select: {
        optionSelectedBg: c['selected-option'],
        optionSelectedColor: c.ink,
        optionSelectedFontWeight: token.weights.text,
      },
      Form: { colorError: c.critical },
      Collapse: { headerBg: c.paper, contentBg: c.paper },
      Tabs: {
        itemSelectedColor: c.ink,
        inkBarColor: c.ink,
        itemHoverColor: c['ink-muted'],
        itemActiveColor: c.ink,
      },
      Card: { headerBg: c.paper, colorBorderSecondary: c.border },
      Drawer: { colorBgElevated: c.paper },
      Breadcrumb: {
        itemColor: c['ink-muted'],
        lastItemColor: c.ink,
        linkColor: c['ink-muted'],
        linkHoverColor: c.ink,
        separatorColor: c['ink-muted'],
      },
    },
  };
}
