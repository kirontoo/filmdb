import { Menu, MenuProps } from "@mantine/core";
import { useCommunityContext } from "@/context/CommunityProvider";
import { ReactNode } from "react";


export interface CommunityMenuActionProps {
  id: string;
  name: string;
}

interface CommunityMenuProps {
  menuAction: (data: CommunityMenuActionProps) => void;
  children: ReactNode;
  menuProps?: MenuProps
}

const CommunityMenu = ({ children, menuAction, menuProps }: CommunityMenuProps) => {
  const { communities } = useCommunityContext();

  return (
    <Menu
      shadow="md"
      trigger="hover"
      position="bottom-start"
      transitionProps={{ exitDuration: 0 }}
      {...menuProps}
    >
      <Menu.Target>{children}</Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Your Communities</Menu.Label>
        {communities.map((c) => (
          <Menu.Item
            key={c.id}
            onClick={() => menuAction({ id: c.id, name: c.name })}
          >
            {c.name}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
export default CommunityMenu;
