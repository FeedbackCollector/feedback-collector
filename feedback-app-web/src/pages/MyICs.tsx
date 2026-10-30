import FeedbackDashboard from "../Components/FeedbackDashboard";
import ObtainICs from "../Components/ShowICs";
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