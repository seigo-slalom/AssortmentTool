import { Alert } from 'antd';

export default function PlaceholderBanner() {
  return (
    <Alert
      type="info"
      showIcon
      banner
      message="Placeholder application"
      description="This starter screen is a placeholder to be replaced by your first feature. It is not production functionality."
    />
  );
}
