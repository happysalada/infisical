import crypto from "crypto";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faArrowUpRightFromSquare, faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  useGetCloudIntegrations,
  useSaveIntegrationAccessToken} from "@app/hooks/api";

import { Button, Card, CardTitle, FormControl, TextArea } from "../../../components/v2";

const schema = yup.object({
  accessToken: yup.string().required("Service Account JSON cannot be empty")
});

type FormData = yup.InferType<typeof schema>;

export default function GCPSecretManagerAuthorizeIntegrationPage() {
  const router = useRouter();

  const {
    control,
    handleSubmit
  } = useForm<FormData>({
    resolver: yupResolver(schema)
  });

  const { data: cloudIntegrations } = useGetCloudIntegrations();

  const { mutateAsync } = useSaveIntegrationAccessToken();
  
  const [isLoading, setIsLoading] = useState(false);
  
  const handleIntegrateWithOAuth = () => {
    if (!cloudIntegrations) return;
    const integrationOption = cloudIntegrations.find((integration) => integration.slug === "gcp-secret-manager");
    
    if (!integrationOption) return;
    
    const state = crypto.randomBytes(16).toString("hex");
    localStorage.setItem("latestCSRFToken", state);
    
    const link = `https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/cloud-platform&response_type=code&access_type=offline&state=${state}&redirect_uri=${window.location.origin}/integrations/gcp-secret-manager/oauth2/callback&client_id=${integrationOption.clientId}`;
    window.location.assign(link);
  }
  
  const onFormSubmit = async ({
    accessToken
  }: FormData) => {
    try {
      setIsLoading(true);
      
      const integrationAuth = await mutateAsync({
        workspaceId: localStorage.getItem("projectData.id"),
        integration: "gcp-secret-manager",
        refreshToken: accessToken
      });
      
      setIsLoading(false);
      router.push(`/integrations/gcp-secret-manager/create?integrationAuthId=${integrationAuth._id}`);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Head>
        <title>Authorize GCP Secret Manager Integration</title>
        <link rel='icon' href='/infisical.ico' />
      </Head>
      <Card className="max-w-lg rounded-md border border-mineshaft-600 mb-12">
        <CardTitle 
          className="text-left px-6 text-xl" 
          subTitle="Connect Infisical to GCP Secret Manager to sync secrets."
        >
          <div className="flex flex-row items-center">
            <div className="inline flex items-center pb-0.5">
              <Image
                src="/images/integrations/Google Cloud Platform.png"
                height={30}
                width={30}
                alt="GCP logo"
              />
            </div>
            <span className="ml-1.5">GCP Secret Manager Integration </span>
            <Link href="https://infisical.com/docs/integrations/cloud/gcp-secret-manager" passHref>
              <a target="_blank" rel="noopener noreferrer">
                <div className="ml-2 mb-1 rounded-md text-yellow text-sm inline-block bg-yellow/20 px-1.5 pb-[0.03rem] pt-[0.04rem] opacity-80 hover:opacity-100 cursor-default">
                  <FontAwesomeIcon icon={faBookOpen} className="mr-1.5"/> 
                  Docs
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-1.5 text-xxs mb-[0.07rem]"/> 
                </div>
              </a>
            </Link>
          </div>
        </CardTitle>
        <div className="px-6">
          <Button
              colorSchema="primary" 
              variant="outline_bg"
              onClick={handleIntegrateWithOAuth}
              leftIcon={<FontAwesomeIcon icon={faGoogle} className="mr-2" />}
              className="h-11 w-full mx-0 mt-4"
          > 
              Continue with OAuth
          </Button>
          <div className='w-full flex flex-row items-center my-4 py-2'>
              <div className='w-full border-t border-mineshaft-400/40' /> 
              <span className="mx-2 text-mineshaft-400 text-xs">or</span>
              <div className='w-full border-t border-mineshaft-400/40' />
          </div>
        </div>
        <form 
          onSubmit={handleSubmit(onFormSubmit)}
          className="px-6 text-right pb-8"
        >
          <Controller
            control={control}
            name="accessToken"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                label="GCP Service Account JSON"
                errorText={error?.message}
                isError={Boolean(error)}
              >
                <TextArea 
                  {...field}
                  className="h-48 border border-mineshaft-600 bg-bunker-900/80"
                />
              </FormControl>
            )}
          />
          <Button
            colorSchema="primary"
            variant="outline_bg"
            className="mt-2 w-min"
            size="sm"
            type="submit"
            isLoading={isLoading}
          >
            Connect to GCP Secret Manager
          </Button>
        </form>
      </Card>
    </div>
  );
}

GCPSecretManagerAuthorizeIntegrationPage.requireAuth = true;
