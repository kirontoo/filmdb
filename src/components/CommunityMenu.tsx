import { Menu } from "@mantine/core";
import { useCommunityContext } from "@/context/CommunityProvider";
import { ReactNode } from "react";

interface CommunityMenuProps {
  menuAction: (id: string) => void;
  children: ReactNode;
}

const CommunityMenu = ({ children, menuAction }: CommunityMenuProps) => {
  const { communities } = useCommunityContext();

  return (
    <Menu
      shadow="md"
      trigger="hover"
      position="bottom-start"
      transitionProps={{ exitDuration: 0 }}
    >
      <Menu.Target>{children}</Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Your Communities</Menu.Label>
        {communities.map((c) => (
          <Menu.Item key={c.id} onClick={() => menuAction(c.id)}>
            {c.name}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
export default CommunityMenu;
