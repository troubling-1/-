# API 设计

## 通用约定

- 返回格式：`{ data, error }`
- 成功状态码：`200`、`201`
- 参数错误：`400`
- 服务端错误：`500`
- 未配置 Supabase 时，部分接口会返回本地示例数据，方便开发阶段直接运行。

## 护航师

### GET `/api/escorts`

查询已审核护航师列表。

返回字段来自 `escorts` 表：

```ts
{
  id: string;
  user_id: string;
  nickname: string;
  avatar: string | null;
  rank: string;
  kd: number;
  price: number;
  bio: string;
  online_status: boolean;
  approved: boolean;
  created_at: string;
}
```

## 订单

### GET `/api/orders`

查询订单示例列表。正式接入时应按当前登录用户过滤。

### POST `/api/orders`

创建订单。

请求体：

```json
{
  "escort_id": "escort uuid",
  "service_type": "evacuation",
  "price": 88,
  "remark": "今晚 9 点后，优先带撤离。",
  "appointment_time": "2026-06-26T21:00:00.000Z"
}
```

校验规则：

- `escort_id` 不能为空
- `service_type` 必须是 `escort`、`evacuation`、`materials`、`rank`、`fun`
- `price` 必须大于 0
- `remark` 长度 5 到 500 字

## 提现

### POST `/api/withdraws`

创建提现申请。

请求体：

```json
{
  "escort_id": "escort uuid",
  "amount": 300
}
```

## 上传

### POST `/api/upload`

上传护航师资料文件到 Supabase Storage 的 `uploads` 桶。

请求格式：`multipart/form-data`

字段：

- `file`：最大 5MB

## 实时聊天

推荐直接使用 Supabase Realtime 订阅 `messages` 表：

```ts
supabase
  .channel("messages")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
    console.log(payload.new);
  })
  .subscribe();
```
