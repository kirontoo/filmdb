import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

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
};

export default Notify;
