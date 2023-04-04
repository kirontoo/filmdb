import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

const Notify = {
  success: (title: string, message: string = "") => {
    return notifications.show({
      title,
      message,
      icon: <IconCheck size="1.1rem" />,
      color: "green",
    });
  },
};

export default Notify;
