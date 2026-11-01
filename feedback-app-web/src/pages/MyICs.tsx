import FeedbackDashboard from "../components/FeedbackDashboard";
import ObtainICs from "../components/ShowICs";


export default function MyICs() {

    return (
        <div>
            <FeedbackDashboard />
            <div
                className="MyICs-containers">
                <ObtainICs />
            </div>
        </div>
    )
}