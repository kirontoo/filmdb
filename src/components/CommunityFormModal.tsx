import {
  createStyles,
  Group,
  Text,
  Button,
  TextInput,
  Textarea,
} from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useCommunityContext } from "@/context/CommunityProvider";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import Notify from "@/lib/notify";

interface CommunityFormModalProps {
  name: string;
  description: string;
  communityId: string;
}

const useStyles = createStyles((theme) => ({
  form: {
    display: "flex",
    gap: theme.spacing.md,
    flexDirection: "column",
  },
}));

export default function CommunityFormModal({
  context,
  id,
  innerProps,
}: ContextModalProps<CommunityFormModalProps>) {
  const { classes } = useStyles();
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { updateCommunityInfo } = useCommunityContext();

  const form = useForm({
    initialValues: {
      name: innerProps.name,
      description: innerProps.description,
    },

    validate: {
      name: (value) =>
        value.length > 3 && value.length < 30
          ? null
          : "Must be between 3-30 chracters",
      description: (value) =>
        value.length >= 0 && value.length < 300
          ? null
          : "Must not exceed 300 characters ",
    },
  });

  const submitChanges = async (values: typeof form.values) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/${innerProps.communityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
        }),
      });

      if (res.ok) {
        const { values } = form;
        updateCommunityInfo(innerProps.communityId, {
          name: values.name,
          description: values.description,
        });

        Notify.success(
          `Update ${values.name}`,
          `${values.name} information was updated!`
        );

        context.closeContextModal(id);
      } else if (res.status === 400) {
        setError("unauthorized");
      } else {
        setError("could not update info");
      }
    } catch (e) {
      setError("could not update info");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={form.onSubmit(submitChanges)} className={classes.form}>
        <TextInput label="Name" {...form.getInputProps("name")} />
        <Textarea
          label={`Description (${form.values.description.length}/300)`}
          autosize
          minRows={4}
          maxRows={4}
          {...form.getInputProps("description")}
        />
        <Text component="span" fz="sm" c="red">
          {error}
        </Text>
        <Group position="right">
          <Button
            variant="subtle"
            onClick={() => context.closeContextModal(id)}
          >
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Update
          </Button>
        </Group>
      </form>
    </>
  );
}
