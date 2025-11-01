interface UserAvatarIconProps {
  readonly size?: string;
}

export function UserAvatarIcon({ size = 'w-6 h-6' }: Readonly<UserAvatarIconProps>) {
  return (
    <div
      className={`${size} bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center`}
    >
      <svg
        className="w-3 h-3 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}
