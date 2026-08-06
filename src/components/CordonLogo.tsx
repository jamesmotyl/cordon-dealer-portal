import Image from "next/image";

export default function CordonLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/cordon-wordmark.svg"
      alt="Cordon"
      width={379}
      height={95}
      priority
      className={className}
    />
  );
}
