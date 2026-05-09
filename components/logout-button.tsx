type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <form action="/auth/logout" method="post">
      <button
        className={
          className ??
          "rounded-2xl border border-court-cyan px-4 py-3 text-sm font-black text-court-cyan transition hover:border-court-ball hover:text-court-ball"
        }
        type="submit"
      >
        Cerrar sesion
      </button>
    </form>
  );
}
