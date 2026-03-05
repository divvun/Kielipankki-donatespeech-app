interface DetailsHeaderProps {
  totalRecorded: string;
  onClose: () => void;
}

export function DetailsHeader({ totalRecorded, onClose }: DetailsHeaderProps) {
  return (
    <div className="bg-white shadow-sm p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Details</h1>

      <div className="flex flex-col items-end mr-4">
        <div className="text-xs text-gray-600 uppercase tracking-wide">
          YOU HAVE DONATED
        </div>
        <div className="text-lg font-semibold text-blue-600">{totalRecorded}</div>
      </div>

      <button
        onClick={onClose}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        Close
      </button>
    </div>
  );
}
