export interface User {
  id: string;
  name: string;
  phone: string;
  password?: string;
  role: "admin" | "user";
  avatar?: string;
}

export const INITIAL_USERS: User[] = [
  {
    id: "admin_1",
    name: "Yönetici (Admin)",
    phone: "+905001112233",
    password: "admin",
    role: "admin",
  },
  {
    id: "user_1",
    name: "Ahmet Yılmaz",
    phone: "+905551234567",
    password: "123",
    role: "user",
  },
  {
    id: "user_2",
    name: "Ayşe Demir",
    phone: "+905511721155",
    password: "123",
    role: "user",
  },
  {
    id: "user_3",
    name: "Mehmet Kaya",
    phone: "+905329876543",
    password: "123",
    role: "user",
  },
];
