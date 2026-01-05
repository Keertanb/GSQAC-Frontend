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
  IconButton,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import useAuthStore from "../../store/useAuthStore";
import {
  schoolMenuItems,
  parentMenuItems,
  inspectorMenuItems,
  adminMenuItems,
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
      default:
        return [];
    }
  }, [role]);

  const roleData = useMemo(() => {
    return roles.find((r) => r.value === role);
  }, [role]);

  const primaryColor = roleData?.color || theme.palette.primary.main;

  const drawer = (
    <Box className="flex flex-col h-screen bg-white">
      <Box
        className="drawer-header relative flex-shrink-0 h-16 flex items-center px-6"
        sx={{
          height: "64px",
          minHeight: "64px",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor} 100%)`,
          },
        }}
      >
        {!matchDownMD && (
          <IconButton
            onClick={handleDrawerToggle}
            className="absolute top-1/2 right-3 transform -translate-y-1/2"
            size="small"
            sx={{
              color: "#6b7280",
              borderRadius: "10px",
              width: "32px",
              height: "32px",
              backgroundColor: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,1)",
                color: primaryColor,
                transform: "translateY(-50%) scale(1.05)",
                boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {open ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        )}

        <Box className="flex items-center gap-3 flex-1">
          {open && (
            <Box>
              <Typography
                className="font-bold text-gray-900"
                sx={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #111827 100%)`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                GSQAC
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.65rem",
                  color: "#6b7280",
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {roleData?.label || "Dashboard"}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Box className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-white">
        <List className="py-4 px-3">
          {menuItems.map((item) => {
            const isActive = item?.activeFinder?.some((path) =>
              location.pathname.includes(path)
            );
            const IconComponent = item.icon;

            return (
              <Box key={item.id} className="mb-2">
                <ListItem disableGutters disablePadding>
                  <ListItemButton
                    className={`group relative transition-all duration-200 ${
                      isActive ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={
                      item.hasSubMenu
                        ? handleSubmenuToggle(item.id)
                        : handleNavigate(item.url)
                    }
                    sx={{
                      paddingBlock: 1.25,
                      paddingInline: open ? 1.5 : 1.5,
                      padding: open ? 3 : 4,
                      borderRadius: "10px",
                      marginX: open ? "8px" : "4px",
                      ...(isActive && {
                        backgroundColor: "#eff6ff",
                        color: `${primaryColor} !important`,
                        "&:hover": {
                          backgroundColor: "#dbeafe",
                        },
                        "& .MuiListItemIcon-root": {
                          color: `${primaryColor} !important`,
                        },
                      }),
                    }}
                  >
                    <ListItemIcon
                      className="item-icon"
                      sx={{
                        minWidth: open ? 40 : 24,
                        justifyContent: open ? "flex-start" : "center",
                        color: isActive ? primaryColor : "#6b7280",
                        marginRight: open ? "16px" : "0px",
                      }}
                    >
                      <IconComponent
                        className="icon"
                        sx={{
                          fontSize: "1.5rem",
                          color: isActive ? primaryColor : "#6b7280",
                        }}
                      />
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          variant: "body1",
                          style: { textWrap: "wrap" },
                          fontWeight: isActive ? 600 : 500,
                          fontSize: "0.9375rem",
                          color: isActive ? primaryColor : "#374151",
                        }}
                        sx={{
                          margin: 0,
                        }}
                      />
                    )}
                    {open && item?.hasSubMenu && (
                      <Box
                        className="ml-auto transition-transform duration-200"
                        sx={{
                          transform:
                            openSubmenuId === item.id
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                        }}
                      >
                        <ExpandMore
                          sx={{
                            fontSize: "1.25rem",
                            color: isActive ? primaryColor : "#9ca3af",
                          }}
                        />
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>
                {open && item?.hasSubMenu && (
                  <Collapse in={openSubmenuId === item.id} timeout="auto">
                    <Box className="ml-6 mr-2 mt-2 mb-2 rounded-lg bg-gray-50">
                      <List component="div" className="py-2">
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
                              className="px-2 mb-1"
                            >
                              <ListItemButton
                                className={`group relative rounded-lg transition-all duration-200 ${
                                  isMenuItemActive
                                    ? "bg-blue-50"
                                    : "hover:bg-gray-100"
                                }`}
                                sx={{
                                  paddingBlock: 1,
                                  paddingInline: 2.5,
                                  borderRadius: "8px",
                                  ...(isMenuItemActive && {
                                    backgroundColor: "#eff6ff",
                                    color: `${primaryColor} !important`,
                                    "&:hover": {
                                      backgroundColor: "#dbeafe",
                                    },
                                    "& .MuiListItemIcon-root": {
                                      color: `${primaryColor} !important`,
                                    },
                                  }),
                                }}
                                onClick={handleNavigate(menuItem.url)}
                              >
                                {SubIconComponent && (
                                  <ListItemIcon
                                    className="item-icon"
                                    sx={{
                                      minWidth: 36,
                                      marginRight: "12px",
                                      color: isMenuItemActive
                                        ? primaryColor
                                        : "#9ca3af",
                                    }}
                                  >
                                    <SubIconComponent
                                      className="icon"
                                      sx={{
                                        fontSize: "1.25rem",
                                        color: isMenuItemActive
                                          ? primaryColor
                                          : "#9ca3af",
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
                                      : "#6b7280",
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
    <Box component="nav" sx={{ flexShrink: { md: 0 }, zIndex: 1300 }}>
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
