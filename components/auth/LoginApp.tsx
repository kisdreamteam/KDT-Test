import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import LoginFooter from './LoginFooter';

export default function LoginApp() {
  return (
    <div className="min-h-screen w-full bg-[#4A3B8D] flex items-center justify-center p-6 font-spartan">
      <div className="w-full max-w-[600px] bg-[#F5F5F5] rounded-[28px] shadow-xl px-8 py-10 relative">
        <LoginHeader />
        <LoginForm />
        <LoginFooter />
      </div>
    </div>
  );
}

