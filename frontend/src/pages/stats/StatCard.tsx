import React from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}

export default function StatCard({ title, value, icon, color }: StatCardProps) {
    return (
        <Card elevation={1}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            bgcolor: (theme) => `${theme.palette[color as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'].main}15`,
                            color: `${color}.main`,
                        }}
                    >
                        {React.cloneElement(icon as React.ReactElement<any>, { fontSize: 'large' })}
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {title}
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}