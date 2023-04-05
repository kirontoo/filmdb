import { notifications } from "@mantine/notifications";
import { IconCheck, IconX, IconExclamationMark } from "@tabler/icons-react";

const Notify = {
  success: (title: string, message: string = "") => {
    return notifications.show({
      title,
      message,
      icon: <IconCheck size="1.1rem" />,
      color: "green",
    });
  },
  error: (title: string, message: string = "") => {
    return notifications.show({
      title,
      message,
      icon: <IconX size="1.1rem" />,
      color: "red",
    });
  },
  warning: (title: string, message: string = "") => {
    return notifications.show({
      title,
      message,
      icon: <IconExclamationMark size="1.1rem" />,
      color: "yellow",
    });
  },
};

export default Notify;
