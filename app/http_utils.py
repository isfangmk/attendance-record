import atexit
from typing import Optional, Dict, Any, Union
from httpx import AsyncClient, TimeoutException, RequestError, HTTPStatusError, Limits


class AsyncHttpTool:
    def __init__(self):
        self._client = AsyncClient(
            timeout=30,
            headers={"Content-Type": "application/json"},
            limits=Limits(max_connections=10, max_keepalive_connections=5, keepalive_expiry=30),
            follow_redirects=True
        )
        atexit.register(self._close)

    @property
    def client(self) -> AsyncClient:
        return self._client

    async def login(self, username: str, password: str) -> Optional[AsyncClient]:
        """登录成功返回client实例，失败返回None"""
        login_url = "https://passport.mokahr.com/api/outer/moka-unified-account/mokaUid/login"
        payload = {"isMobile": False, "bus": 20, "email": username, "password": password}

        try:
            print(f"🔑 正在登录 MokaHR 账号: {username} ...")
            resp = await self._client.post(login_url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if data.get("success"):
                if "moka-jwt" in self._client.cookies.keys():
                    print("✅ 登录成功！")
                    self._client.headers["Cookie"] = "; ".join([f"{name}={value}" for name, value in self._client.cookies.items()])
                    return self._client  # 登录成功返回client实例
                else:
                    rid = data['data'].get("rid")
                    payload['rid'] = rid
                    payload['force'] = True
                    print("🔑 已在别处登录，正在强制登录...")
                    self._client.headers["Cookie"] = "; ".join([f"{name}={value}" for name, value in self._client.cookies.items()])
                    resp = await self._client.post(login_url, json=payload)
                    resp.raise_for_status()
                    if "moka-jwt" in self._client.cookies.keys():
                        print("✅ 登录成功！")
                        self._client.headers["Cookie"] = "; ".join([f"{name}={value}" for name, value in self._client.cookies.items()])
                        return self._client  # 登录成功返回client实例
                    else:
                        print("❌ 登录失败：未获取到moka-jwt")
                        return None
            else:
                msg = data.get("msg", "未知错误")
                print(f"❌ 登录失败: {msg}")
                return None
        except Exception as e:
            print(f"⚠️ 登录过程发生异常: {e}")
            return None

    async def logout(self) -> bool:
        login_url = "https://core.mokahr.com/api/outer/moka-unified-account/mokaUid/logout?bus=20"
        payload = {"loginType": "10"}

        try:
            print(f"🔑 正在退出 MokaHR 账号")
            resp = await self._client.post(login_url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if data.get("success"):
                print("✅ 退出成功！")
                return True
            else:
                msg = data.get("msg", "未知错误")
                print(f"❌ 退出失败: {msg}")
                return False
        except Exception as e:
            print(f"⚠️ 退出过程发生异常: {e}")
            return False

    async def get(self, url: str, **kwargs) -> Optional[Dict[Any, Any]]:
        try:
            resp = await self._client.get(url,** kwargs)
            resp.raise_for_status()
            return resp.json()
        except (TimeoutException, RequestError, HTTPStatusError) as e:
            print(f"❌ GET error on {url}: {e}")
            return None
        except Exception as e:
            print(f"⚠️ Unexpected GET error on {url}: {e}")
            return None

    async def post(self, url: str, data: Optional[Union[dict, list]] = None, **kwargs) -> Optional[Dict[Any, Any]]:
        try:
            resp = await self._client.post(url, json=data,** kwargs)
            resp.raise_for_status()
            return resp.json()
        except (TimeoutException, RequestError, HTTPStatusError) as e:
            print(f"❌ POST error on {url}: {e}")
            return None
        except Exception as e:
            print(f"⚠️ Unexpected POST error on {url}: {e}")
            return None

    def set_auth_info(self, cookie: Optional[str] = None, token: Optional[str] = None) -> None:
        if cookie is not None:
            self._client.headers["Cookie"] = cookie
        if token is not None:
            self._client.headers["Authorization"] = f"Bearer {token}"

    def _close(self):
        if self._client is None:
            return

        import asyncio
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return

        if loop.is_closed():
            return

        try:
            loop.run_until_complete(self._client.aclose())
        except RuntimeError:
            pass
        finally:
            self._client = None