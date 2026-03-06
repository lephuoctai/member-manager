import { authorize, getUserInfo } from "zmp-sdk";

export interface ZaloUser {
  id: string;
  name: string;
  avatar: string;
}

export async function getZaloUser(): Promise<ZaloUser> {
  await authorize({
    scopes: ["scope.userInfo"],
  });

  const { userInfo } = await getUserInfo({});
  return {
    id: userInfo.id,
    name: userInfo.name,
    avatar: userInfo.avatar,
  };
}

