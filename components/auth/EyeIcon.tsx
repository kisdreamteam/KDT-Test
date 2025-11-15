interface EyeIconProps {
  hidden?: boolean;
}

export default function EyeIcon({ hidden = false }: EyeIconProps) {
  if (hidden) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 3l18 18M10.584 10.587A3 3 0 0012 15a3 3 0 002.414-4.413M9.88 4.603A9.758 9.758 0 0112 4.5c5.523 0 9.75 4.5 9.75 7.5-.28.61-.86 1.55-1.78 2.54m-3.17 2.37C15.312 18.52 13.733 19.5 12 19.5c-5.523 0-9.75-4.5-9.75-7.5 0-.61.248-1.31.694-2.08M7.5 7.5c1.22-1.22 2.79-2.04 4.5-2.25"
        />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
      />
      <circle cx="12" cy="12" r="3" strokeWidth="2" />
    </svg>
  );
}

