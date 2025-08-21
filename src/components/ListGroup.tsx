

function ListGroup() {
    const items = [ 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix' ];
  return (
    <>
    <h1>List</h1>
    <div className="list-group">
    {items.map((item =><li key={item}>{item}</li>) )}
    </div>
    </>
  );
}
export default ListGroup;