import type { MailboxId } from '../lib/mailboxes';

type Props = {
  id: MailboxId;
};

/**
 * Gmail and Apple paths are from simple-icons (CC0).
 * Yahoo, Hotmail, Outlook, AOL, Live, and Privacy are original marks in the brand colors.
 */
export function MailboxIcon({ id }: Props) {
  return (
    <svg className="mail-icon" viewBox="0 0 24 24" aria-hidden="true">
      {mark(id)}
    </svg>
  );
}

function mark(id: MailboxId) {
  switch (id) {
    case 'gmail':
      return (
        <path
          fill="#EA4335"
          d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
        />
      );
    case 'yahoo':
      return <path fill="#6001D2" d="M2.6 2.8h5.2L12 11.2 16.2 2.8h5.2L14.3 14.4V21h-4.6v-6.6L2.6 2.8z" />;
    case 'hotmail':
      return (
        <>
          <path
            fill="#F15A22"
            d="M3 7.1A2.1 2.1 0 0 1 5.1 5h13.8A2.1 2.1 0 0 1 21 7.1V17a2.1 2.1 0 0 1-2.1 2.1H5.1A2.1 2.1 0 0 1 3 17V7.1z"
          />
          <path fill="#fff" d="M3.4 6.8 12 13.1 20.6 6.8v1.8L12 15.1 3.4 8.6V6.8z" />
        </>
      );
    case 'aol':
      return (
        <path
          fill="#F4F7FB"
          d="M12 2.4 21.2 20.8h-3.5l-1.7-4H8l-1.7 4H2.8L12 2.4zm0 6.1-2.5 5.8h5L12 8.5z"
        />
      );
    case 'live':
      return (
        <path
          fill="#00A4EF"
          d="M5 4.5h11.2A2.8 2.8 0 0 1 19 7.3v6.4a2.8 2.8 0 0 1-2.8 2.8H10l-3.6 2.8c-.8.6-1.9-.1-1.9-1V16.5H5.8A2.8 2.8 0 0 1 3 13.7V7.3A2.8 2.8 0 0 1 5.8 4.5H5z"
        />
      );
    case 'apple':
      return (
        <path
          fill="#F5F5F7"
          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
        />
      );
    case 'outlook':
      return (
        <>
          <rect width="24" height="24" rx="6" fill="#0F6CBD" />
          <path fill="#7CC4FF" d="M5 8.2 12 12.8 19 8.2 12 5.4 5 8.2z" />
          <path fill="#fff" d="M5 9.4 12 14.2 19 9.4V16.6c0 .8-.6 1.4-1.4 1.4H6.4C5.6 18 5 17.4 5 16.6V9.4z" />
        </>
      );
    case 'privacy':
      return (
        <path
          fill="#C9B6FF"
          d="M8 10.2V8.2a4 4 0 0 1 8 0v2h1.1A1.9 1.9 0 0 1 19 12.1v6.9A1.9 1.9 0 0 1 17.1 21H6.9A1.9 1.9 0 0 1 5 19V12.1a1.9 1.9 0 0 1 1.9-1.9H8zm1.7 0h4.6V8.2a2.3 2.3 0 0 0-4.6 0v2z"
        />
      );
  }
}
