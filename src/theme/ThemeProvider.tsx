import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { useLayoutTier } from '../hooks/useLayoutTier';
import { buildAntdTheme } from './antdTheme';
import { buildCssVariables } from './cssVariables';
import { buildFontFaceCss, fontUrl } from './fontFaces';
import type { Density } from './token';

const fontFaceCss = buildFontFaceCss(fontUrl);

/**
 * Applies the token-derived Ant Design theme, CSS variables, bundled font faces, and the
 * `data-tier` / `data-density` attributes (port of the prototype's ChanelUI BrandProvider).
 * The compact tier always renders at standard density, as in the prototype.
 */
export function ThemeProvider({
  density = 'standard',
  children,
}: {
  density?: Density;
  children: ReactNode;
}) {
  const tier = useLayoutTier();
  const compact = tier === 'compact';
  const effectiveDensity: Density = compact ? 'standard' : density;
  const theme = useMemo(
    () => buildAntdTheme(effectiveDensity, { compact }),
    [effectiveDensity, compact],
  );
  const variables = useMemo(() => buildCssVariables(effectiveDensity), [effectiveDensity]);

  // Mirror variables and attributes on <html> so portalled overlays (drawers) get them too.
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(variables)) root.style.setProperty(name, value);
    root.dataset.tier = tier;
    root.dataset.density = effectiveDensity;
  }, [variables, tier, effectiveDensity]);

  return (
    <ConfigProvider theme={theme} wave={{ disabled: true }}>
      <style>{fontFaceCss}</style>
      <div
        className="cds-root"
        data-tier={tier}
        data-density={effectiveDensity}
        style={variables as CSSProperties}
      >
        {children}
      </div>
    </ConfigProvider>
  );
}
