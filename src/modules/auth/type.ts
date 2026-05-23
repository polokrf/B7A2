export interface IUsers {
  name:string;
  email:string;
  password:string;
  role:'contributor' | 'maintainer';
}

export interface ILogin{
  email: string,
  password:string
}