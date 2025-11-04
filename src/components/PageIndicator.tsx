interface PageIndicatorProps {
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
}

const PageIndicator: React.FC<PageIndicatorProps> = ({ 
  totalPages, 
  currentPage, 
  onPageChange 
}) => {
  return (
    <div className="flex justify-center gap-2 py-4">
      {Array.from({ length: totalPages }).map((_, index) => (
        <div
          key={index}
          onClick={() => onPageChange(index)}
          className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
            index === currentPage 
              ? 'bg-gray-800 w-6' 
              : 'bg-gray-400 w-2 hover:bg-gray-500'
          }`}
        />
      ))}
    </div>
  )
}

export default PageIndicator
