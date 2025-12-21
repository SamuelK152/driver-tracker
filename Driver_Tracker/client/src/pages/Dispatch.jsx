import PageShell from "../lib/PageShell";
import DetailedView from "../components/DetailedView";

const Dispatch = () => {
  return (
    <PageShell title="Dispatch Overview">
      <DetailedView
        summary={<p>Dispatch Summary Placeholder</p>}
        leftPanel={<p>Dispatch Left Panel Placeholder</p>}
        rightPanel={<p>Dispatch Right Panel Placeholder</p>}
      >
        <p className="mb-4">Dispatch Dashboard Content</p>
      </DetailedView>
    </PageShell>
  );
};

export default Dispatch;
