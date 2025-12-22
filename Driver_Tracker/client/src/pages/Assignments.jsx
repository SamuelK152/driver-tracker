import PageShell from "../lib/PageShell";
import DetailedView from "../components/DetailedView";

const Assignments = () => {
  return (
    <PageShell title="Assignments">
      <DetailedView
        summary={<p>Assignments Summary Placeholder</p>}
        leftPanel={<p>Assignments Left Panel Placeholder</p>}
        rightPanel={<p>Assignments Right Panel Placeholder</p>}
      ></DetailedView>
    </PageShell>
  );
};

export default Assignments;
