interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Image */}
      <img 
        src="/logo.png" 
        alt="TRADE UP Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
      
      {/* App Name */}
      {showText && (
        <span className={`font-bold text-yellow-400 ${textSizes[size]} tracking-wide`}>
          TRADE UP
        </span>
      )}
    </div>
  );
}
