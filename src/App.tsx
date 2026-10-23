import { lazy, Suspense } from 'react';
import { Flex, Layout, Space, Spin, Typography } from 'antd';
import { Route, Routes } from 'react-router-dom';
import { usePowerContext } from './lib/powerContext';

const { Header, Content, Footer } = Layout;

// Route-level code-splitting: as new pages are added under src/pages, import them
// with lazy() (not a static import) so each route ships its own chunk instead of
// growing the main bundle. See frontend-standards.md for the rationale.
const HomePage = lazy(() => import('./pages/HomePage'));

export default function App() {
  const context = usePowerContext();
  const userName = context?.user.fullName;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          Power Platform Code App — Starter
        </Typography.Title>
        {userName && (
          <Typography.Text style={{ color: '#fff' }}>Signed in as {userName}</Typography.Text>
        )}
      </Header>
      <Content style={{ padding: 24 }}>
        <Suspense
          fallback={
            <Flex justify="center" style={{ padding: 48 }}>
              <Spin size="large" />
            </Flex>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Suspense>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        <Space>Slalom · Spec-Driven Development Starter</Space>
      </Footer>
    </Layout>
  );
}
