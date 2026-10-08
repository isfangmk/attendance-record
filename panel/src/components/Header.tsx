/**
 * 顶部导航：标题、配置入口与登录状态
 */

interface HeaderProps {
  isLoggedIn: boolean;
  displayName?: string;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSettingsClick: () => void;
}

/**
 * 粘性顶栏（毛玻璃）
 */
export const Header = ({
  isLoggedIn,
  displayName,
  onLoginClick,
  onLogoutClick,
  onSettingsClick,
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <div className="container mx-auto max-w-[min(85vw,1020px)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-sm">
            <i className="fa fa-calendar-check-o text-xl" />
          </div>
          <h1 className="font-display text-[clamp(1.25rem,3vw,1.5rem)] font-bold text-neutral-700 tracking-tight">
            出勤统计面板
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <>
              <button
                onClick={onSettingsClick}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors duration-200"
                title="提醒配置"
              >
                <i className="fa fa-bell-o" />
                <span className="hidden sm:inline">提醒配置</span>
              </button>
              <div className="hidden md:flex items-center gap-2 text-neutral-600">
                <i className="fa fa-user-o" />
                <span className="font-medium">{displayName}</span>
              </div>
              <button
                onClick={onLogoutClick}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors duration-200"
                title="退出登录"
              >
                <i className="fa fa-sign-out" />
                <span className="hidden sm:inline">退出</span>
              </button>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 px-4 py-2 text-sm text-primary bg-primary/10 hover:bg-primary/15 rounded-xl transition-colors duration-200"
            >
              <i className="fa fa-sign-in" />
              <span>登录</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
