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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Box
        className="drawer-header"
        sx={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          position: "relative",
          flexShrink: 0,
        }}
      >
        {!matchDownMD && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "white",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                transform: "scale(1.1)",
              },
              transition: "all 0.2s ease",
              zIndex: 10,
            }}
            size="small"
          >
            {open ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        )}
        <Typography className="logo-text">GSQAC</Typography>
        <Typography className="logo-subtitle">
          Gujarat School Quality Accreditation
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minHeight: 0,
        }}
      >
        <List>
          {menuItems.map((item) => {
            const isActive = item?.activeFinder?.some((path) =>
              location.pathname.includes(path)
            );
            const IconComponent = item.icon;

            return (
              <Box key={item.id}>
                <ListItem disableGutters disablePadding>
                  <ListItemButton
                    className={isActive ? "btn-active" : ""}
                    onClick={
                      item.hasSubMenu
                        ? handleSubmenuToggle(item.id)
                        : handleNavigate(item.url)
                    }
                    sx={{
                      paddingBlock: 1,
                      paddingInline: 2,
                      ...(isActive && {
                        backgroundColor: `${primaryColor} !important`,
                        color: "white !important",
                        "&:hover": {
                          backgroundColor: `${primaryColor}dd !important`,
                        },
                        "& .MuiListItemIcon-root": {
                          color: "white !important",
                        },
                      }),
                    }}
                  >
                    <ListItemIcon className="item-icon">
                      <IconComponent
                        className={`icon ${isActive ? "active" : ""}`}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        variant: "subtitle1",
                        style: { textWrap: "wrap" },
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#fff" : theme.palette.text.primary,
                      }}
                    />
                    {item?.hasSubMenu &&
                      (openSubmenuId === item.id ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      ))}
                  </ListItemButton>
                </ListItem>
                {item?.hasSubMenu && (
                  <Collapse in={openSubmenuId === item.id} timeout="auto">
                    <List
                      component="div"
                      sx={{ bgcolor: "rgba(0, 0, 0, 0.02)" }}
                    >
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
                          >
                            <ListItemButton
                              sx={{
                                paddingBlock: 1,
                                paddingInline: 3,
                                borderLeft: "4px solid transparent",
                                "&:hover": {
                                  borderLeft: `4px solid ${primaryColor}`,
                                  bgcolor: "rgba(0, 0, 0, 0.04)",
                                },
                                ...(isMenuItemActive && {
                                  borderLeft: `4px solid ${primaryColor}`,
                                  bgcolor: `${primaryColor}15`,
                                  backgroundColor: `${primaryColor} !important`,
                                  color: "white !important",
                                  "&:hover": {
                                    backgroundColor: `${primaryColor}dd !important`,
                                  },
                                  "& .MuiListItemIcon-root": {
                                    color: "white !important",
                                  },
                                }),
                              }}
                              className={isMenuItemActive ? "btn-active" : ""}
                              onClick={handleNavigate(menuItem.url)}
                            >
                              {SubIconComponent && (
                                <ListItemIcon
                                  className="item-icon"
                                  sx={{ minWidth: 40 }}
                                >
                                  <SubIconComponent
                                    className={`icon ${
                                      isMenuItemActive ? "active" : ""
                                    }`}
                                  />
                                </ListItemIcon>
                              )}
                              <ListItemText
                                primary={menuItem.label}
                                primaryTypographyProps={{
                                  variant: "subtitle1",
                                  style: { textWrap: "wrap" },
                                  fontWeight: isMenuItemActive ? 600 : 500,
                                  color: isMenuItemActive
                                    ? "#fff"
                                    : theme.palette.text.primary,
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
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
