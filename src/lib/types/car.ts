export interface Car {
  id: string;
  uid: string;
  name: string;
  price: number;
  year: number;
  info: string;
  tel: string;
  email: string;
  imagePath: string[];
  featured: boolean;
  status: string;
  views: number;
  posted: string;
  createdAt: string;
}
  export interface CarFormData {
    name: string;
    price: number;
    year: number;
    info: string;
    tel: string;
  }