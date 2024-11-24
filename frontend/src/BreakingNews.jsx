// eslint-disable-next-line react/prop-types
const BreakingNews = ({ message }) => {
  return (
    <div
      className="h-14 w-full overflow-hidden absolute bottom-0"
    >
      <div
        className="h-14 w-full bg-blue-700 animate-slideup flex items-center"
      >
        {/* eslint-disable-next-line react/jsx-no-comment-textnodes */}
        <div className="parallelogram">// BREAKING NEWS //</div>
        <div
          className="text-white text-2xl font-bold uppercase ml-64 absolute animate-slidein whitespace-nowrap"
        >
          {message}
        </div>

      </div>

    </div>
  );
};

export default BreakingNews;
