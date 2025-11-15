import SignupHeader from './SignupHeader';
import SignupAvatar from './SignupAvatar';
import SignupForm from './SignupForm';

export default function SignupApp() {
  return (
    <div className="min-h-screen w-full bg-[#4A3B8D] flex items-center justify-center p-6 relative">
      <SignupHeader />
      
      <div className="w-full max-w-7xl flex items-center gap-8">
        <SignupAvatar />
        
        {/* Form Card on Right */}
        <div className="w-full lg:w-[600px] bg-[#F5F5F5] rounded-[28px] shadow-xl p-8 sm:p-10 relative">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}

