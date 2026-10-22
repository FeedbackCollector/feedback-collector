export default function FeedbackLogComp() {
return (
    <>
    <div className="box box-columns">
      <h3>FeedBack Log</h3>
      <div>
        <div className="box-grid">
            <div className="box-columns">
               IC
                <input type="Search Feedback" className="input-control" />
            </div>
            <div className="box-columns">
                PROJECT
                <select id="" name="fruta" className="input-control">
                    <option value=""></option>
                    {
                      <option value="Project"></option>
                        
                    }
                </select>

            </div>
            <div className="box-columns">
                SCORE
                <select id="" name="Score" className="input-control">
                    <option value=""></option>
                    {
                      <option value="Project"></option>
                        
                    }
                </select>

            </div>
            <div className="box-columns">
                SORT BY DATE
                <select id="" name="Date" className="input-control">
                    <option value=""></option>
                    {
                      <option value="Project"></option>
                        
                    }
                </select>

            </div>
        </div>
        <div className="box-columns">
            SEARCH
            <input type="Search Feedback" className="input-control" />
        </div>
      </div>
    </div>
</>
);
}