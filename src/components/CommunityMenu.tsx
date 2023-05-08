import { Text, Avatar, Menu, MenuProps, Group } from "@mantine/core";
import { useCommunityContext } from "@/context/CommunityProvider";
import { ReactNode } from "react";

export interface CommunityMenuActionProps {
  id: string;
  name: string;
}

interface CommunityMenuProps {
  menuAction: (data: CommunityMenuActionProps) => void;
  children: ReactNode;
  menuProps?: MenuProps;
}

const CommunityMenu = ({
  children,
  menuAction,
  menuProps,
}: CommunityMenuProps) => {
  const { communities } = useCommunityContext();

  return (
    <Menu shadow="md" transitionProps={{ exitDuration: 0 }} {...menuProps}>
      <Menu.Target>{children}</Menu.Target>

      <Menu.Dropdown>
        <Menu.Label fw="bold" fz="md" sx={{ color: "white" }}>
          Add to Community Watch List
        </Menu.Label>
        {communities.map((c) => (
          <Menu.Item
            key={c.id}
            onClick={() => menuAction({ id: c.id, name: c.name })}
          >
            <Group>
              <Avatar color="gray.1" radius="xl" size="lg">
                {c.name[0].toUpperCase()}
              </Avatar>
              <Text color="white" tt="capitalize">
                {c.name}
              </Text>
            </Group>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
export default CommunityMenu;
