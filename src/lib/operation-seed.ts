import { escorts, reviews } from "@/lib/mock-data";

export const platformStats = {
  todayOrders: 37,
  todayAmount: 4268,
  onlineEscorts: escorts.filter((escort) => escort.online_status).length,
  completedOrders: 1846,
  averageResponseMinutes: 4,
  positiveRate: 98.2,
  activeUsers: 312,
  afterSaleSolvedRate: 96.8,
};

export const todayDeals = [
  { id: "deal-001", user: "沪***7", service: "带撤离", escort: "夜枭", amount: 88, status: "已接单", time: "2 分钟前" },
  { id: "deal-002", user: "粤***2", service: "物资护送", escort: "北境", amount: 128, status: "进行中", time: "6 分钟前" },
  { id: "deal-003", user: "苏***9", service: "上分护航", escort: "灰烬", amount: 68, status: "已完成", time: "11 分钟前" },
  { id: "deal-004", user: "京***5", service: "任务推进", escort: "赤线", amount: 78, status: "已接单", time: "18 分钟前" },
  { id: "deal-005", user: "川***1", service: "娱乐陪玩", escort: "棱镜", amount: 49, status: "待接单", time: "24 分钟前" },
];

export const latestReviewFeed = reviews.map((review) => {
  const escort = escorts.find((item) => item.id === review.escort_id);

  return {
    ...review,
    userName: `玩家 ${review.user_id.slice(-3)}`,
    escortName: escort?.nickname || "护航师",
    serviceLabel: escort?.special_modes?.[0] || "护航服务",
  };
});

export const hotEscorts = [...escorts]
  .sort((left, right) => (right.order_count || 0) - (left.order_count || 0))
  .slice(0, 4)
  .map((escort, index) => ({
    ...escort,
    heatRank: index + 1,
    todayOrders: [12, 9, 7, 6][index] || 3,
  }));

export const userCenterStats = {
  totalOrders: 18,
  completedOrders: 12,
  pendingReviews: 2,
  savedAmount: 320,
};

export const adminOperationStats = {
  grossMerchandiseValue: 126880,
  monthlyOrders: 942,
  pendingAfterSale: 5,
  pendingReports: 3,
  newUsersToday: 46,
  escortOnlineRate: 72,
};
