import { EventProvider } from "../contexts/EventContext";
import EventLog from "./EventLog";

const EventLogProvider = ({ children }) => {
  return (
    <EventProvider>
      {children}
      <EventLog />
    </EventProvider>
  );
};

export default EventLogProvider;
