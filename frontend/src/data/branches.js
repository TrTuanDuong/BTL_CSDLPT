export const branches = [
  {
    id: 'branch-cg',
    code: 'CG',
    name: 'Cầu Giấy',
    shortName: 'CG',
    address: '18 Phạm Hùng, Cầu Giấy, Hà Nội',
    phone: '024 7300 8181',
    status: 'Đang hoạt động',
    color: '#667eea',
    description: 'Cụm rạp trung tâm phục vụ suất chiếu cao điểm, quầy vé và thanh toán tại chỗ.',
  },
  {
    id: 'branch-bd',
    code: 'BD',
    name: 'Ba Đình',
    shortName: 'BD',
    address: '27 Đội Cấn, Ba Đình, Hà Nội',
    phone: '024 7301 9191',
    status: 'Đang hoạt động',
    color: '#f59e0b',
    description: 'Chi nhánh hỗ trợ đặt vé, quản lý phòng chiếu và check-in trực tiếp.',
  },
  {
    id: 'branch-ntl',
    code: 'NTL',
    name: 'Nam Từ Liêm',
    shortName: 'NTL',
    address: 'Mỹ Đình, Nam Từ Liêm, Hà Nội',
    phone: '024 7302 9292',
    status: 'Đang hoạt động',
    color: '#10b981',
    description: 'Chi nhánh mới với khu vực quầy vé và hỗ trợ thanh toán online.',
  },
  {
    id: 'branch-hd',
    code: 'HD',
    name: 'Hà Đông',
    shortName: 'HD',
    address: 'Tố Hữu, Hà Đông, Hà Nội',
    phone: '024 7303 9393',
    status: 'Đang hoạt động',
    color: '#ef4444',
    description: 'Chi nhánh tập trung khán giả gia đình, bố trí ghế đôi và VIP.',
  },
];

export const DEFAULT_BRANCH_ID = branches[0].id;

export const getBranchById = (branchId) => branches.find((branch) => branch.id === branchId) || branches[0];
