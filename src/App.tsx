import { Layout, Space, Typography } from 'antd';
import { Route, Routes } from 'react-router-dom';
import PlaceholderBanner from './components/PlaceholderBanner';
import { usePowerContext } from './lib/powerContext';

const { Header, Content, Footer } = Layout;

// Feature screens are added as routes here (lazy-load each page from src/pages).
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
        <Routes>
          <Route path="*" element={<PlaceholderBanner />} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        <Space>Slalom · Spec-Driven Development Starter</Space>
      </Footer>
    </Layout>
  );
}
