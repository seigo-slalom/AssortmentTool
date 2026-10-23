import { Alert, Button, Card, Empty, Input, Space, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import PlaceholderBanner from '../components/PlaceholderBanner';
import { useCreateSampleItem, useSampleItems } from '../hooks/useSampleItems';
import type { SampleItem } from '../lib/placeholderService';

const columns: TableColumnsType<SampleItem> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
];

const addItemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
});
type AddItemForm = z.infer<typeof addItemSchema>;

export default function HomePage() {
  const { data, isLoading, isError, error } = useSampleItems();
  const createItem = useCreateSampleItem();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddItemForm>({
    resolver: zodResolver(addItemSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = handleSubmit(async ({ name }) => {
    await createItem.mutateAsync(name);
    reset();
  });

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PlaceholderBanner />
      <Card title="Sample items">
        {isError ? (
          <Alert
            type="error"
            showIcon
            message="Failed to load items"
            description={error instanceof Error ? error.message : undefined}
          />
        ) : (
          <Table<SampleItem>
            rowKey="id"
            columns={columns}
            dataSource={data}
            loading={isLoading}
            locale={{
              emptyText: (
                <Empty description="No data source connected yet. Run 'pa app add data-source' and replace the placeholder service." />
              ),
            }}
          />
        )}
      </Card>
      <Card title="Add a sample item">
        {/* Worked example of RHF + Zod + a TanStack Query mutation — deliberately not using
            antd's own Form component so this pattern is a drop-in reference once you swap
            in a generated service. */}
        <form onSubmit={onSubmit} noValidate>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Item name"
                  status={errors.name ? 'error' : undefined}
                />
              )}
            />
            {errors.name && <Typography.Text type="danger">{errors.name.message}</Typography.Text>}
            {createItem.isError && (
              <Alert
                type="error"
                showIcon
                message="Failed to add item"
                description={
                  createItem.error instanceof Error ? createItem.error.message : undefined
                }
              />
            )}
            <Button type="primary" htmlType="submit" loading={createItem.isPending}>
              Add item
            </Button>
          </Space>
        </form>
      </Card>
      <Typography.Paragraph type="secondary">
        This screen is a placeholder. Replace it with your first feature using the Spec-Driven
        Development workflow (/speckit.specify → /speckit.plan → /speckit.tasks →
        /speckit.implement).
      </Typography.Paragraph>
    </Space>
  );
}
