/**
 * Base Email Template
 *
 * Provides a consistent layout with header and footer for all Revendiste emails.
 * Uses Tailwind CSS for styling with the design system colors.
 */

import React, {type ReactNode} from 'react';
import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import tailwindConfig from '../tailwind.config';

interface BaseEmailProps {
  preview?: string;
  title: string;
  children: ReactNode;
  appBaseUrl?: string;
}

export function BaseEmail({
  preview,
  title,
  children,
  appBaseUrl = 'https://revendiste.com',
}: BaseEmailProps) {
  return (
    <Html>
      <Preview>{preview || title}</Preview>
      <Tailwind config={tailwindConfig}>
        <Head />
        <Body className="bg-background-secondary font-sans">
          <Container
            className="mx-auto bg-card max-w-[600px] my-8"
            style={{borderRadius: '8px'}}
          >
            {/* Header */}
            <Section
              className="bg-primary px-8 py-6"
              style={{borderRadius: '8px 8px 0 0'}}
            >
              <Heading className="text-2xl font-bold text-primary-foreground m-0">
                <Img
                  src={`https://cdn.revendiste.com/assets/horizontal-logo.png`}
                  alt="Revendiste Logo"
                  width={'150'}
                  height={'auto'}
                />
              </Heading>
            </Section>

            {/* Content */}
            <Section className="px-8 py-6">
              <Heading className="text-xl font-semibold text-foreground mb-4 mt-0">
                {title}
              </Heading>
              {children}
            </Section>

            {/* Footer */}
            <Hr className="border-border my-0" />
            <Section className="px-8 py-4 bg-muted">
              <Text className="text-xs text-muted-foreground text-center m-0 mb-2">
                Este es un mensaje automático de Revendiste. Por favor, no
                respondas a este correo.
              </Text>
              <Row>
                <Column align="center">
                  <Link
                    href={appBaseUrl}
                    className="text-primary no-underline text-xs"
                  >
                    Visita Revendiste
                  </Link>
                </Column>
              </Row>
              <Row>
                <Column align="center">
                  <Link
                    href="https://www.instagram.com/revendiste.uy"
                    className="text-primary no-underline text-xs"
                  >
                    Instagram
                  </Link>
                </Column>
                <Column align="center" style={{width: '8px'}}>
                  <Text className="text-xs text-muted-foreground m-0">•</Text>
                </Column>
                <Column align="center">
                  <Link
                    href="https://www.tiktok.com/@revendiste"
                    className="text-primary no-underline text-xs"
                  >
                    TikTok
                  </Link>
                </Column>
                <Column align="center" style={{width: '8px'}}>
                  <Text className="text-xs text-muted-foreground m-0">•</Text>
                </Column>
                <Column align="center">
                  <Link
                    href="https://x.com/revendiste"
                    className="text-primary no-underline text-xs"
                  >
                    Twitter / X
                  </Link>
                </Column>
                <Column align="center" style={{width: '8px'}}>
                  <Text className="text-xs text-muted-foreground m-0">•</Text>
                </Column>
                <Column align="center">
                  <Link
                    href="https://wa.me/59899303326"
                    className="text-primary no-underline text-xs"
                  >
                    WhatsApp
                  </Link>
                </Column>
              </Row>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
