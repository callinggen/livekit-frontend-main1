import { CheckCircle2, XCircle } from "lucide-react";

export const validatePassword = (password: string) => {
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    hasMinLen,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isValid: hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial
  };
};

const ValidationItem = ({ fulfilled, text }: { fulfilled: boolean, text: string }) => (
  <div className={`flex items-center gap-2 text-xs ${fulfilled ? 'text-green-600 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
    {fulfilled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5 opacity-50" />}
    <span>{text}</span>
  </div>
);

export const PasswordValidationRules = ({ password }: { password: string }) => {
  const { hasMinLen, hasUpper, hasLower, hasNumber, hasSpecial } = validatePassword(password);
  
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="grid grid-cols-2 gap-2">
        <ValidationItem fulfilled={hasMinLen} text="At least 8 characters" />
        <ValidationItem fulfilled={hasUpper} text="One uppercase letter" />
        <ValidationItem fulfilled={hasLower} text="One lowercase letter" />
        <ValidationItem fulfilled={hasNumber} text="One number" />
        <ValidationItem fulfilled={hasSpecial} text="One special character" />
      </div>
    </div>
  );
};
