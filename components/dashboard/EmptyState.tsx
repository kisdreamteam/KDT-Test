interface EmptyStateProps {
  onAddClick: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

export default function EmptyState({ 
  onAddClick, 
  title = "Welcome to your dashboard!",
  message = "You haven't created any classes yet. Create your first class to get started with managing your students.",
  buttonText = "Create Your First Class"
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="text-gray-400 mb-8">
        <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {message}
      </p>
      
      <div 
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:scale-105"
        onClick={onAddClick}
      >
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>{buttonText}</span>
        </div>
      </div>
    </div>
  );
}

