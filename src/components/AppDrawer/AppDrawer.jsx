import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  useMediaQuery,
  Typography,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import useAuthStore from "../../store/useAuthStore";
import {
  schoolMenuItems,
  parentMenuItems,
  inspectorMenuItems,
  adminMenuItems,
  crcMenuItems,
  DRAWER_WIDTH,
} from "../../constants/menuItems";
import { roles } from "../../constants/roles";
import DrawerWrapper from "./AppDrawer.style";
import "./AppDrawer.css";

const closedMixin = (theme) => ({
  width: 0,
  overflowX: "hidden",
  transition: theme.transitions.create(["width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
});

const MiniAppDrawer = styled(DrawerWrapper, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    width: DRAWER_WIDTH.xs,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
      width: DRAWER_WIDTH.xl,
    },
    "& .MuiDrawer-paper": {
      width: DRAWER_WIDTH.xs,
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
        width: DRAWER_WIDTH.xl,
      },
    },
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": {
      ...closedMixin(theme),
      borderRight: "none",
    },
  }),
}));

const AppDrawer = ({ open, handleDrawerToggle }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const { role } = useAuthStore();
  const [openSubmenuId, setOpenSubmenuId] = useState(null);

  const handleSubmenuToggle = (menuId) => () => {
    setOpenSubmenuId((currentId) => (currentId === menuId ? null : menuId));
  };

  const handleNavigate = (to) => () => {
    navigate(to);
    if (matchDownMD) handleDrawerToggle();
  };

  const menuItems = useMemo(() => {
    switch (role) {
      case "school":
        return schoolMenuItems;
      case "parent":
        return parentMenuItems;
      case "inspector":
        return inspectorMenuItems;
      case "admin":
        return adminMenuItems;
      case "crc":
        return crcMenuItems;
      default:
        return [];
    }
  }, [role]);

  const roleData = useMemo(() => {
    return roles.find((r) => r.value === role);
  }, [role]);

  const primaryColor = roleData?.color || theme.palette.primary.main;

  const drawer = (
    <Box
      className="flex flex-col h-screen"
      sx={{
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor} 100%)`,
          zIndex: 1,
        },
      }}
    >
      <Box
        className="drawer-header relative flex-shrink-0 flex items-center"
        sx={{
          height: "84px",
          minHeight: "84px",
          maxHeight: "84px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
          position: "relative",
          px: open ? 2.5 : 1.5,
          py: 1.25,
        }}
      >
        <Box className="flex items-center gap-3 flex-1" sx={{ minWidth: 0 }}>
          {open && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                p: 1,
                borderRadius: "14px",
                border: "1px solid rgba(148, 163, 184, 0.22)",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(241,245,249,0.88) 100%)",
              }}
            >
              <Box
                sx={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 6px 14px ${primaryColor}35`,
                }}
              >
                <Typography
                  sx={{
                    color: "white",
                    fontWeight: 800,
                    fontSize: "1.25rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  G
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                    fontFamily:
                      "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                    background: `linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  GSQAC
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.625rem",
                    color: primaryColor,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontFamily:
                      "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                    lineHeight: 1.4,
                    mt: 0.4,
                    display: "inline-flex",
                    alignItems: "center",
                    px: 0.75,
                    py: 0.2,
                    borderRadius: "999px",
                    backgroundColor: `${primaryColor}14`,
                    border: `1px solid ${primaryColor}2a`,
                  }}
                >
                  {roleData?.label || "Dashboard"}
                </Typography>
              </Box>
            </Box>
          )}
          {!open && (
            <Box
              sx={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 12px ${primaryColor}30`,
                mx: "auto",
              }}
            >
              <Typography
                sx={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  letterSpacing: "-0.02em",
                }}
              >
                G
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Box
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
        sx={{
          background: "transparent",
          px: open ? 2 : 1,
          py: 2,
        }}
      >
        <List sx={{ py: 0 }}>
          {menuItems.map((item) => {
            const isActive = item?.activeFinder?.some((path) =>
              location.pathname.includes(path)
            );
            const IconComponent = item.icon;

            return (
              <Box key={item.id} sx={{ mb: 1 }}>
                <ListItem disableGutters disablePadding>
                  <ListItemButton
                    className="group relative"
                    onClick={
                      item.hasSubMenu
                        ? handleSubmenuToggle(item.id)
                        : handleNavigate(item.url)
                    }
                    sx={{
                      padding: open ? "12px 16px" : "12px",
                      borderRadius: "12px",
                      marginX: open ? "4px" : "0px",
                      position: "relative",
                      minHeight: "48px",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      ...(isActive && {
                        background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}08 100%)`,
                        color: `${primaryColor} !important`,
                        fontWeight: 600,
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "4px",
                          height: "60%",
                          background: `linear-gradient(180deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                          borderRadius: "0 4px 4px 0",
                          boxShadow: `0 0 12px ${primaryColor}50`,
                        },
                        "&:hover": {
                          background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}12 100%)`,
                          transform: "translateX(4px)",
                          boxShadow: `0 4px 12px ${primaryColor}20`,
                        },
                        "& .MuiListItemIcon-root": {
                          color: `${primaryColor} !important`,
                        },
                        boxShadow: `0 2px 8px ${primaryColor}15`,
                      }),
                      "&:hover:not(.Mui-selected)": {
                        backgroundColor: "rgba(0, 0, 0, 0.03)",
                        transform: "translateX(4px)",
                        ...(!isActive && {
                          "& .MuiListItemIcon-root": {
                            color: "#475569",
                          },
                        }),
                      },
                    }}
                  >
                    <ListItemIcon
                      className="item-icon"
                      sx={{
                        minWidth: open ? 40 : "auto",
                        justifyContent: open ? "flex-start" : "center",
                        color: isActive ? primaryColor : "#64748b",
                        marginRight: open ? "12px" : "0px",
                        transition: "all 0.25s ease",
                      }}
                    >
                      <Box
                        sx={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isActive
                            ? `${primaryColor}15`
                            : "rgba(0, 0, 0, 0.02)",
                          transition: "all 0.25s ease",
                          "&:hover": {
                            background: isActive
                              ? `${primaryColor}25`
                              : "rgba(0, 0, 0, 0.05)",
                          },
                        }}
                      >
                        <IconComponent
                          className="icon"
                          sx={{
                            fontSize: "1.375rem",
                            color: isActive ? primaryColor : "#64748b",
                            transition: "all 0.25s ease",
                          }}
                        />
                      </Box>
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          variant: "body1",
                          style: { textWrap: "wrap" },
                          fontWeight: isActive ? 600 : 500,
                          fontSize: "0.9375rem",
                          color: isActive ? primaryColor : "#334155",
                          fontFamily:
                            "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                          letterSpacing: "-0.01em",
                          lineHeight: 1.5,
                        }}
                        sx={{
                          margin: 0,
                        }}
                      />
                    )}
                    {open && item?.hasSubMenu && (
                      <Box
                        className="ml-auto"
                        sx={{
                          transform:
                            openSubmenuId === item.id
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          transition:
                            "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        <ExpandMore
                          sx={{
                            fontSize: "1.25rem",
                            color: isActive ? primaryColor : "#94a3b8",
                          }}
                        />
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>
                {open && item?.hasSubMenu && (
                  <Collapse
                    in={openSubmenuId === item.id}
                    timeout="auto"
                    sx={{
                      mt: 1,
                    }}
                  >
                    <Box
                      sx={{
                        ml: 5,
                        mr: 1,
                        mt: 0.5,
                        mb: 0.5,
                        borderRadius: "12px",
                        background: "rgba(0, 0, 0, 0.02)",
                        border: "1px solid rgba(0, 0, 0, 0.04)",
                        overflow: "hidden",
                      }}
                    >
                      <List component="div" sx={{ py: 1 }}>
                        {item.subMenu?.map((menuItem) => {
                          const isMenuItemActive = menuItem?.activeFinder?.some(
                            (path) => location.pathname.includes(path)
                          );
                          const SubIconComponent = menuItem.icon;

                          return (
                            <ListItem
                              disableGutters
                              disablePadding
                              key={menuItem?.id}
                              sx={{ px: 1.5, mb: 0.5 }}
                            >
                              <ListItemButton
                                className="group relative"
                                sx={{
                                  padding: "10px 14px",
                                  borderRadius: "10px",
                                  position: "relative",
                                  minHeight: "44px",
                                  transition:
                                    "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                  ...(isMenuItemActive && {
                                    background: `linear-gradient(135deg, ${primaryColor}12 0%, ${primaryColor}06 100%)`,
                                    color: `${primaryColor} !important`,
                                    fontWeight: 600,
                                    "&::before": {
                                      content: '""',
                                      position: "absolute",
                                      left: 0,
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      width: "3px",
                                      height: "50%",
                                      background: `linear-gradient(180deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                                      borderRadius: "0 3px 3px 0",
                                      boxShadow: `0 0 8px ${primaryColor}40`,
                                    },
                                    "&:hover": {
                                      background: `linear-gradient(135deg, ${primaryColor}18 0%, ${primaryColor}10 100%)`,
                                      transform: "translateX(4px)",
                                    },
                                    "& .MuiListItemIcon-root": {
                                      color: `${primaryColor} !important`,
                                    },
                                    boxShadow: `0 2px 6px ${primaryColor}12`,
                                  }),
                                  "&:hover:not(.Mui-selected)": {
                                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    transform: "translateX(4px)",
                                    ...(!isMenuItemActive && {
                                      "& .MuiListItemIcon-root": {
                                        color: "#475569",
                                      },
                                    }),
                                  },
                                }}
                                onClick={handleNavigate(menuItem.url)}
                              >
                                {SubIconComponent && (
                                  <ListItemIcon
                                    className="item-icon"
                                    sx={{
                                      minWidth: 32,
                                      marginRight: "10px",
                                      color: isMenuItemActive
                                        ? primaryColor
                                        : "#94a3b8",
                                    }}
                                  >
                                    <SubIconComponent
                                      className="icon"
                                      sx={{
                                        fontSize: "1.125rem",
                                        color: isMenuItemActive
                                          ? primaryColor
                                          : "#94a3b8",
                                      }}
                                    />
                                  </ListItemIcon>
                                )}
                                <ListItemText
                                  primary={menuItem.label}
                                  primaryTypographyProps={{
                                    variant: "body2",
                                    style: { textWrap: "wrap" },
                                    fontWeight: isMenuItemActive ? 600 : 500,
                                    fontSize: "0.875rem",
                                    color: isMenuItemActive
                                      ? primaryColor
                                      : "#64748b",
                                    fontFamily:
                                      "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                                    letterSpacing: "-0.01em",
                                    lineHeight: 1.5,
                                  }}
                                  sx={{
                                    margin: 0,
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        flexShrink: { md: 0 },
        zIndex: matchDownMD ? theme.zIndex.modal : 1300,
      }}
    >
      {!matchDownMD ? (
        <MiniAppDrawer variant="permanent" anchor="left" open={open}>
          {drawer}
        </MiniAppDrawer>
      ) : (
        <DrawerWrapper
          open={open}
          variant="temporary"
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            zIndex: theme.zIndex.modal,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH.xs,
              boxSizing: "border-box",
              borderRight: `1px solid ${theme.palette.divider}`,
              overflowX: "hidden",
              [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
                width: DRAWER_WIDTH.xl,
              },
            },
          }}
        >
          {drawer}
        </DrawerWrapper>
      )}
    </Box>
  );
};

export default AppDrawer;
